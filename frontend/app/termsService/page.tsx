"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function TermsServiceScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] flex items-center justify-center p-4">
      <Card className="backdrop-blur-md bg-white/10 shadow-xl border border-white/20 text-white p-6 rounded-2xl w-[90%] max-w-4xl mx-auto">
        <CardHeader className="text-center mb-4">
          <h2 className="text-3xl font-bold">Términos de Servicio</h2>
        </CardHeader>

        <CardContent className="space-y-4 text-white/90 text-sm md:text-base leading-relaxed">
          <p>
            Bienvenido a PlayDeep. Al acceder y utilizar esta plataforma, aceptas los siguientes términos y condiciones:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Uso de la Plataforma:</strong> PlayDeep ofrece herramientas y servicios para el análisis de partidos de fútbol. El uso de la plataforma debe ser siempre conforme a la ley y a estos términos.
            </li>
            <li>
              <strong>Registro y Seguridad:</strong> Para acceder a ciertas funciones, es necesario crear una cuenta proporcionando información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta.
            </li>
            <li>
              <strong>Privacidad:</strong> Respetamos tu privacidad. Consulta nuestra Política de Privacidad para conocer cómo recopilamos, usamos y protegemos tus datos personales.
            </li>
            <li>
              <strong>Propiedad Intelectual:</strong> Todos los contenidos, marcas, logos y software de PlayDeep son propiedad de sus respectivos titulares y están protegidos por las leyes de propiedad intelectual. No está permitido copiar, modificar o distribuir ningún contenido sin autorización.
            </li>
            <li>
              <strong>Conducta del Usuario:</strong> No está permitido utilizar la plataforma para actividades ilícitas, ofensivas o que puedan dañar a otros usuarios o a la propia plataforma.
            </li>
            <li>
              <strong>Modificaciones del Servicio:</strong> PlayDeep se reserva el derecho de modificar, suspender o interrumpir el servicio en cualquier momento, con o sin previo aviso.
            </li>
            <li>
              <strong>Limitación de Responsabilidad:</strong> La plataforma se ofrece “tal cual” y no garantizamos que el servicio sea ininterrumpido o libre de errores. PlayDeep no se hace responsable de daños directos o indirectos derivados del uso de la plataforma.
            </li>
            <li>
              <strong>Contacto:</strong> Para cualquier consulta o solicitud relacionada con estos términos, puedes escribirnos a
              <a href="mailto:soporte@playdeep.pro" className="text-blue-300 underline ml-1">soporte@playdeep.pro</a>.
            </li>
          </ol>
          <p>
            Al continuar utilizando PlayDeep, aceptas estos Términos de Servicio. Nos reservamos el derecho de actualizar estos términos en cualquier momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
