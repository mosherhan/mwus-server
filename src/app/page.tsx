import ChatWidget from "@/components/ChatWidget";

export default function Home (){
  return(
    <main className="min-h-screen bg-gray-50 flex items-center justify-center"> 
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">MakeWithUs</h1>
          <p className="text-gray-500 text-lg">We build websites & apps that grow your business.</p>
        
      </div>
      <ChatWidget/>
    </main>
  )
}