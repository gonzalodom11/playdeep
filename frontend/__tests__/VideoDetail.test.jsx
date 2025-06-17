import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import VideoDetail from '../app/videos/[year]/[month]/[day]/[slug]/page';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { toast } from '../hooks/use-toast';

// Mock the toast hook
jest.mock('../hooks/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock SWR to avoid cache between tests
const renderWithSWR = (component) => {
  return render(
    <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
      {component}
    </SWRConfig>
  );
};

// Mock HTMLVideoElement
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  writable: true,
  value: false,
});

describe('VideoDetail Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should load video details successfully', async () => {
    renderWithSWR(<VideoDetail />);

    // Wait for video details to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Check that video element is present (video elements don't have a standard role)
    const videoElement = document.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', 'https://example.com/test-video.mp4');
  });

  test('should allow user to input custom prompt and analyze with AI successfully', async () => {
    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Find the prompt input field
    const promptInput = screen.getByPlaceholderText('Escribe tu pregunta aquí...');
    expect(promptInput).toBeInTheDocument();

    // Clear existing prompt and type custom prompt
    await user.clear(promptInput);
    const customPrompt = '¿Cuántos jugadores están en posición de offside?';
    await user.type(promptInput, customPrompt);

    // Verify the input has the custom prompt
    expect(promptInput).toHaveValue(customPrompt);

    // Find and click the "Analizar con IA" button
    const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });
    expect(analyzeButton).toBeInTheDocument();

    await user.click(analyzeButton);

    // Wait for analysis result to appear (MSW responds quickly, so we skip loading state)
    await waitFor(() => {
      expect(screen.getByText(/respuesta de la ia/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check that the analysis contains our custom prompt
    await waitFor(() => {
      const analysisText = screen.getByText((content, element) => {
        return content.includes(`Análisis basado en: "${customPrompt}"`);
      });
      expect(analysisText).toBeInTheDocument();
    });

    // Verify the full analysis text is displayed
    await waitFor(() => {
      expect(screen.getByText(/el equipo atacante muestra una formación ofensiva clara/i)).toBeInTheDocument();
    });
  });

  test('should handle API error and show toast notification', async () => {
    // Override the handler to return an error for this test
    server.use(
      rest.post('http://localhost:8000/api/videos/2024/01/15/test-video/analyze-llm', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.text('Internal Server Error')
        );
      })
    );

    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Find and click the "Analizar con IA" button
    const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });
    await user.click(analyzeButton);

    // Wait for error toast to be called
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error al analizar",
        description: expect.stringContaining("HTTP 500"),
        variant: "destructive",
      });
    });

    // Verify no analysis result is shown
    expect(screen.queryByText(/respuesta de la ia/i)).not.toBeInTheDocument();
  });

  test('should handle network error and show appropriate toast', async () => {
    // Override the handler to simulate network error
    server.use(
      rest.post('http://localhost:8000/api/videos/2024/01/15/test-video/analyze-llm', (req, res, ctx) => {
        return res.networkError('Failed to connect');
      })
    );

    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Find and click the "Analizar con IA" button
    const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });
    await user.click(analyzeButton);

    // Wait for error toast to be called
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Error al analizar",
        description: expect.any(String),
        variant: "destructive",
      });
    });
  });

  test('should trigger analysis and show result', async () => {
    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Click analyze button
    const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });
    await user.click(analyzeButton);

    // Wait for analysis result to appear (MSW responds quickly so we check the final result)
    await waitFor(() => {
      expect(screen.getByText(/respuesta de la ia/i)).toBeInTheDocument();
    });
  });

  test('should handle frame number input changes', async () => {
    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Find the frame number input
    const frameInput = screen.getByDisplayValue('5');
    expect(frameInput).toBeInTheDocument();

    // Change frame number
    await user.clear(frameInput);
    await user.type(frameInput, '10');

    expect(frameInput).toHaveValue(10);
  });

  test('should handle frame number changes correctly', async () => {
    renderWithSWR(<VideoDetail />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Video de prueba para análisis')).toBeInTheDocument();
    });

    // Change the frame number
    const frameInput = screen.getByDisplayValue('5');
    await user.clear(frameInput);
    await user.type(frameInput, '15');

    // Verify the frame number was updated
    expect(frameInput).toHaveValue(15);

    // Verify analyze button is still clickable after frame change
    const analyzeButton = screen.getByRole('button', { name: /analizar con ia/i });
    expect(analyzeButton).toBeEnabled();
  });
}); 