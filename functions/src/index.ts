// Arquivo: functions/src/index.ts (VERSÃO FINAL E CORRETA)

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

admin.initializeApp();
const db = admin.firestore();

export const updateUserPosts = onDocumentUpdated("usuarios/{userId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) {
    logger.info("Documento não existe, saindo.");
    return null;
  }

  const nomeAntes = beforeData.nomeCompleto;
  const fotoAntes = beforeData.profilePicUrl;
  const nomeDepois = afterData.nomeCompleto;
  const fotoDepois = afterData.profilePicUrl;

  if (nomeAntes === nomeDepois && fotoAntes === fotoDepois) {
    logger.info("Nenhuma alteração de perfil relevante. Saindo.");
    return null;
  }

  const userId = event.params.userId;
  logger.info(`Usuário ${userId} atualizou o perfil. Verificando posts...`);

  const batch = db.batch();
  const postsQuery = db.collection("posts").where("userId", "==", userId);
  const postsSnapshot = await postsQuery.get();

  if (postsSnapshot.empty) {
    logger.info("Usuário não tem posts para atualizar.");
    return null;
  }

  postsSnapshot.forEach((postDoc) => {
    logger.info(`Atualizando post ${postDoc.id}...`);
    const postRef = db.collection("posts").doc(postDoc.id);
    batch.update(postRef, {
      userName: nomeDepois,
      userProfilePicUrl: fotoDepois || "",
    });
  });

  await batch.commit();
  logger.info(`${postsSnapshot.size} post(s) atualizados com sucesso!`);
  return null;
});