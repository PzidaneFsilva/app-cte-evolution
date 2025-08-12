// Arquivo: functions/src/index.ts (VERSÃO COM A NOVA FUNÇÃO DE EXCLUSÃO)

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getDistance } from "geolib";

admin.initializeApp();
const db = admin.firestore();

// --- FUNÇÃO DE SINCRONIZAÇÃO DE PERFIL ---
export const updateUserPosts = onDocumentUpdated("usuarios/{userId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) { return; }

    const nomeAntes = beforeData.nomeCompleto;
    const fotoAntes = beforeData.profilePicUrl;
    const nomeDepois = afterData.nomeCompleto;
    const fotoDepois = afterData.profilePicUrl;

    if (nomeAntes === nomeDepois && fotoAntes === fotoDepois) { return; }

    const userId = event.params.userId;
    const batch = db.batch();
    const postsQuery = db.collection("posts").where("userId", "==", userId);
    const postsSnapshot = await postsQuery.get();

    if (postsSnapshot.empty) { return; }

    postsSnapshot.forEach((postDoc) => {
      const postRef = db.collection("posts").doc(postDoc.id);
      batch.update(postRef, { userName: nomeDepois, userProfilePicUrl: fotoDepois || "" });
    });

    await batch.commit();
    logger.info(`${postsSnapshot.size} post(s) atualizados para o usuário ${userId}`);
    return;
});


// --- FUNÇÃO GERADORA DE CÓDIGOS ---
export const gerarCodigosCheckin = onSchedule("every 5 minutes", async () => {
  logger.info("Executando verificação para gerar códigos de check-in...");
  const agora = new Date();
  const hojeString = agora.toISOString().split("T")[0];
  
  const q = db.collection("turmas")
    .where("data", "==", hojeString)
    .where("codigoCheckin", "==", null);
  
  const snap = await q.get();
  if (snap.empty) { logger.info("Nenhuma turma nova para gerar código."); return; }

  const batch = db.batch();
  snap.forEach((doc) => {
    const turma = doc.data();
    const [horaFim, minFim] = turma.horario.split(" - ")[1].split(":").map(Number);
    const horarioGeracao = new Date();
    horarioGeracao.setHours(horaFim, minFim - 5, 0, 0);

    if (agora >= horarioGeracao) {
      const codigo = Math.random().toString(36).substring(2, 7).toUpperCase();
      logger.info(`Gerando código ${codigo} para a turma ${doc.id}`);
      const turmaRef = db.collection("turmas").doc(doc.id);
      batch.update(turmaRef, {
        codigoCheckin: codigo,
        codigoGeradoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  await batch.commit();
  return;
});


// --- FUNÇÃO VALIDADORA DE CHECK-IN ---
export const validarCheckin = onCall(async (request) => {
  if (!request.auth) { throw new HttpsError("unauthenticated", "Você precisa estar logado."); }
  const { codigo, localizacao } = request.data;
  const userId = request.auth.uid;
  if (!codigo || !localizacao) { throw new HttpsError("invalid-argument", "Código e localização são obrigatórios."); }

  const hojeString = new Date().toISOString().split("T")[0];
  const qTurma = db.collection("turmas").where("data", "==", hojeString).where("codigoCheckin", "==", codigo);
  const snapTurma = await qTurma.get();
  if (snapTurma.empty) { throw new HttpsError("not-found", "Código inválido ou expirado."); }

  const turmaDoc = snapTurma.docs[0];
  const turma = turmaDoc.data();
  
  const [horaFim, minFim] = turma.horario.split(" - ")[1].split(":").map(Number);
  const horarioLimite = new Date();
  horarioLimite.setHours(horaFim, minFim + 30, 0, 0);
  if (new Date() > horarioLimite) { throw new HttpsError("deadline-exceeded", "O tempo para validar esta aula já expirou."); }

  const configRef = db.collection("configuracoes").doc("boxInfo");
  const configDoc = await configRef.get();
  const boxLocation = configDoc.data();
  if (!boxLocation) { throw new HttpsError("internal", "A localização do box não foi configurada."); }
  
  const distancia = getDistance(
    { latitude: localizacao.latitude, longitude: localizacao.longitude },
    { latitude: boxLocation.latitude, longitude: boxLocation.longitude }
  );
  if (distancia > 200) { throw new HttpsError("permission-denied", `Você está muito longe. Aproxime-se do box para validar.`); }

  const checkinRef = db.collection(`usuarios/${userId}/checkinsValidados`).doc(hojeString);
  const checkinDoc = await checkinRef.get();
  if (checkinDoc.exists) { throw new HttpsError("already-exists", "Você já validou um check-in hoje, que vale para o desafio."); }
  
  await checkinRef.set({
    desafioId: "ID_DO_DESAFIO_ATIVO",
    data: hojeString,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    turmaId: turmaDoc.id,
  });

  return { success: true, message: "Check-in validado com sucesso!" };
});

// --- NOVA FUNÇÃO PARA EXCLUIR USUÁRIOS PERMANENTEMENTE ---
export const deleteUser = onCall(async (request) => {
  const uid = request.data.uid;
  if (!uid) {
    throw new HttpsError(
      "invalid-argument",
      "O UID do usuário é obrigatório."
    );
  }

  // O ideal é adicionar uma verificação de permissão aqui,
  // usando 'custom claims' para garantir que apenas admins podem chamar a função.
  // if (request.auth?.token.role !== 'administrador') {
  //   throw new HttpsError("permission-denied", "Apenas administradores podem excluir usuários.");
  // }

  try {
    // 1. Exclui o usuário do Firebase Authentication
    await admin.auth().deleteUser(uid);
    logger.info(`Usuário do Auth com UID ${uid} excluído com sucesso.`);

    // 2. Exclui o documento do usuário no Firestore
    await db.collection("usuarios").doc(uid).delete();
    logger.info(`Documento do Firestore para UID ${uid} excluído com sucesso.`);

    return { success: true, message: "Usuário excluído completamente." };
  } catch (error) {
    logger.error("Erro ao excluir usuário:", error);
    throw new HttpsError(
      "internal",
      "Ocorreu um erro ao tentar excluir o usuário."
    );
  }
});