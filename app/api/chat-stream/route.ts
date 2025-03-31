
import { ragChat } from "@/app/lib/rag-chat";
import { aiUseChatAdapter } from "@upstash/rag-chat/nextjs";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
    try {
        console.log("Appel en cours...")
        const { messages , sessionId} = await req.json()
        const lastMessage = messages[messages.length - 1].content
        const promptInFrench = `Réponds en français : ${lastMessage}`
        const response = await ragChat.chat(promptInFrench , {streaming :true , sessionId})
        if(!response){
            console.log("Aucune réponse obtenue.")
            return new Response("Aucune réponse obtenue.", { status: 500 })
        }

        console.log(response)

        return aiUseChatAdapter(response)

    } catch (error) {
        console.error("🚨 Erreur serveur :", error);
        return new Response("Une erreur est survenue.", { status: 500 })
    }

}