import React from 'react';
import Chat from '../components/Chat';
import { cookies } from 'next/headers';
import { redis } from '../lib/redis';
import { ragChat } from '../lib/rag-chat';

// Définition correcte de PageProps
interface PageProps {
  params: {
    link?: string | string[];
  };
}

// Fonction pour reconstruire l'URL correctement
function reconstructUrl({ url }: { url: string[] }) {
  return url.map((component) => decodeURIComponent(component)).join('/');
}

const Page = async ({ params }: PageProps) => {
  // Récupération des cookies
  const sessionCookies = (await cookies()).get("sessionId")?.value;

  // Vérification si params.link existe
  if (!params?.link) {
    return <div>Erreur: Aucun lien fourni</div>;
  }

  // Transformation de params.link en tableau
  const linkArray = Array.isArray(params.link) ? params.link : [params.link];

  // Reconstruction du lien décodé
  const decodedLink = reconstructUrl({ url: linkArray });

  // Création de l'ID de session unique
  const sessionId = (decodedLink + "__" + sessionCookies).replace(/\//g, "");

  // Vérification si l'URL est déjà indexée
  const isAlreadyIndexed = await redis.sismember("indexed-urls", decodedLink);
  console.log("isAlreadyIndexed:", isAlreadyIndexed);

  if (!isAlreadyIndexed) {
    console.log("Indexation en cours...");
    await ragChat.context.add({
      type: "html",
      source: decodedLink,
      config: { chunkOverlap: 50, chunkSize: 200 },
    });
    await redis.sadd("indexed-urls", decodedLink);
  }

  // Récupération des messages initiaux
  const initialMessages = await ragChat.history.getMessages({ amount: 10, sessionId });

  return (
    <Chat
      decodedLink={decodedLink}
      sessionId={sessionId}
      initialMessages={initialMessages}
    />
  );
};

export default Page;
