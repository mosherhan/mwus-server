export function generateWhatsAppLink(phone:string,message:string):string{
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return  `https://wa.me/${cleanPhone}?text=${encodeMessage}`;
    
}

export function openWhatsApp(customMessage?: string){
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "91XXXXXXXXXX";
    const message= customMessage || "Hi, I'm interested in building a website with MakeWithUs.";
    const link = generateWhatsAppLink(phone_message);
    window.open(link,"_blank");
}