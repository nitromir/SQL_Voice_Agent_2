import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '../../constants';

export const runtime = 'edge';

interface OpenAIResponse {
    id: string;
  model: string;
  modalities: string[];
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: {
    model: string;
  };
  turn_detection: null;
  instructions: string;
  temperature: number;
  max_response_output_tokens: string;
  client_secret: {
    value: string;
  };
  tools?: any[];
  tool_choice?: string;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const requestData = await request.json();
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        modalities: ["audio", "text"],
        voice: "ballad",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection:{
          type: "server_vad",
          // Optional parameters to fine-tune Voice Activity Detection (VAD)
          threshold: 0.6, // Sensitivity of speech detection
          prefix_padding_ms: 300, // Padding before detected speech
          silence_duration_ms: 500 // Silence duration to consider speech ended
          },
        instructions: SYSTEM_PROMPT,
        temperature: 0.6,
        max_response_output_tokens: "inf",
        tools: requestData.tools,
        tool_choice: requestData.tool_choice
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return NextResponse.json(
        { 
          error: `Failed to generate token: ${errorText}`,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const data = await response.json() as OpenAIResponse;
    console.log('OpenAI API Response:', data);
    
    if (!data.client_secret) {
      console.error('Invalid response from OpenAI:', data);
      return NextResponse.json(
        { error: 'Invalid response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      client_secret: data.client_secret,
      url: "https://api.openai.com/v1/realtime",
      session: {
        id: data.id,
        model: data.model,
        modalities: data.modalities,
        voice: data.voice,
        input_audio_format: data.input_audio_format,
        output_audio_format: data.output_audio_format,
        input_audio_transcription: data.input_audio_transcription,
        turn_detection: data.turn_detection,
        instructions: data.instructions,
        temperature: data.temperature,
        max_response_output_tokens: data.max_response_output_tokens,
        tools: data.tools,
        tool_choice: data.tool_choice
      }
    });
  } catch (error) {
    console.error('Session Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}
