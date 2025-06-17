import { rest } from 'msw';

const apiUrl = 'http://localhost:8000/api/videos/';

export const handlers = [
  // Mock para obtener detalles del video
  rest.get(`${apiUrl}2024/01/15/test-video`, (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        caption: 'Video de prueba para análisis',
        video: 'https://example.com/test-video.mp4',
        publish: '2024-01-15T10:00:00Z',
        slug: 'test-video',
        user: {
          username: 'testuser',
          email: 'test@example.com',
        },
      })
    );
  }),

  // Mock para detección de jugadores
  rest.get(`${apiUrl}2024/01/15/test-video/detect-players`, (req, res, ctx) => {
    // Simular una imagen blob para la detección de jugadores
    const mockImageBuffer = Buffer.from('mock-image-data');
    return res(
      ctx.set('Content-Type', 'image/png'),
      ctx.body(mockImageBuffer)
    );
  }),

  // Mock para análisis con LLM - Respuesta exitosa
  rest.post(`${apiUrl}2024/01/15/test-video/analyze-llm`, async (req, res, ctx) => {
    const body = await req.json();
    const { prompt } = body;

    return res(
      ctx.json({
        analysis: `Análisis basado en: "${prompt}". En esta imagen se puede observar un momento clave del partido donde los jugadores están posicionados estratégicamente. El equipo atacante muestra una formación ofensiva clara, mientras que la defensa mantiene una línea compacta. El balón se encuentra en una posición que sugiere una oportunidad de pase hacia adelante.`,
      })
    );
  }),

  // Mock para análisis con LLM - Error 500
  rest.post(`${apiUrl}2024/01/15/test-video/analyze-llm-error`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.text('Internal Server Error')
    );
  }),
]; 