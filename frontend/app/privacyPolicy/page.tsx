"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyScreen() {
  return (
    <div className="min-h-screen bg-football-dark flex items-center justify-center p-4">
      <Card className="backdrop-blur-md bg-white/10 shadow-xl border border-white/20 text-white p-6 rounded-2xl w-[90%] max-w-2xl mx-auto">
        <CardHeader className="text-center mb-4">
          <h2 className="text-3xl font-bold">Política de Privacidad</h2>
        </CardHeader>

        <CardContent className="space-y-4 text-white/90 text-sm md:text-base leading-relaxed">
          <p>
            Esta aplicación respeta y protege la privacidad de todos los usuarios. 
            No compartimos información personal con terceros sin su consentimiento explícito.
          </p>

          <p>
            Los datos recopilados se utilizan exclusivamente para mejorar la experiencia del usuario 
            y ofrecer funcionalidades relacionadas con el servicio.
          </p>

          <p>
            Puedes solicitar la eliminación de tus datos en cualquier momento escribiéndonos a 
            <a href="mailto:soporte@playdeep.pro" className="text-blue-300 underline ml-1">
              soporte@playdeep.pro
            </a>.
          </p>

          <p>
            Al continuar utilizando esta plataforma, aceptas los términos de esta política de privacidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
