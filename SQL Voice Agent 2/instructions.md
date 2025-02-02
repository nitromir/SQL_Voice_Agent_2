# Project Overview
This project implements a voice-enabled SQL agent that allows users to interact with databases through natural language conversations. The application leverages:
- OpenAI's Realtime API with WebRTC for voice communication and real-time responses
- N8N workflow automation platform for SQL query processing and database interactions
- Function calling capabilities for structured data operations and visualization

The architecture consists of:
- A client-side Next.js application handling voice input and visualization
- WebRTC-based real-time communication with OpenAI's models
- N8N workflows for SQL query processing and database management
- Data visualization components for representing query results

**Technologies Used:**
- Next.js (App Router) for the application framework
- WebRTC for real-time voice and data channels
- OpenAI Realtime API with function calling
- N8N for SQL agent workflow automation
- TypeScript for type safety
- React for UI components
- Recharts for data visualization

---

## Core Functionalities

### 1. Server-Side API Route for Ephemeral Token
- **Description**: A Next.js API route (`app/api/session/route.ts`) that:
  - Uses the OpenAI API key to request an ephemeral token
  - Returns the ephemeral token to the client
  - Implements Edge Runtime for better performance

- **Implementation Details**:
  1. Create a `.env.local` file to securely store the `OPENAI_API_KEY`
  2. Implement the API route to:
     - Fetch the token by calling the OpenAI Realtime API endpoint
     - Handle error cases and log failures
     - Return the token in JSON format
     
- **API Configuration**:
  ```typescript
  {
    model: "gpt-4o-realtime-preview-2024-12-17",
    modalities: ["audio", "text"],
    voice: "verse",
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    input_audio_transcription: null
    turn_detection: "server_vad",
    instructions: "You are a helpful assistant for Agenix AI...",
    temperature: 0.8,
    max_response_output_tokens: "inf"
  }
  ```

### 2. Client-Side WebRTC Connection

- **Description**: A client-side implementation (`app/page.tsx`) that:
  - Fetches the ephemeral token from the server
  - Establishes a WebRTC connection with the Realtime API
  - Manages microphone selection and audio streams
  - Handles connection states and reconnection

- **Implementation Details**:

#### State Management:
```typescript
const [isMicActive, setIsMicActive] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [messages, setMessages] = useState<Array<{
  id: string;
  type: 'user' | 'assistant';
  text: string;
  partial?: boolean;
}>>([]);
const [availableMicrophones, setAvailableMicrophones] = useState<Array<{
  deviceId: string;
  label: string;
}>>([]);
```

#### WebRTC Setup:
- Create and manage RTCPeerConnection
- Handle ICE candidates and connection state changes
- Implement reconnection logic on connection failure
- Manage audio tracks and data channels

### 3. Event Handling via Data Channel

- **Description**: Manage bidirectional communication with the OpenAI model using WebRTC data channels.

- **Implementation Details**:

#### Send Events:
- Voice input streaming through audio tracks
- Control messages through data channel:
  ```typescript
  dcRef.current?.send(JSON.stringify({
    type: "response.create",
    response: {
      modalities: ["text", "audio"],
    }
  }));
  ```

#### Receive Events:
- Handle streaming text responses (`response.text.delta`)
- Process audio responses for playback
- Manage conversation state and partial messages

### 4. Modern UI Implementation

- **Description**: A modern, responsive UI implementation using React components and styled animations.

- **Implementation Details**:

#### Component Structure:
- `Background.tsx`: Animated gradient background with floating particles
- `MicButton.tsx`: Interactive microphone button with loading and pulse animations
- `MessageList.tsx`: Animated message display with streaming text support

#### Styling Features:
- Deep blue and dark purple gradient background
- modern typography
- Responsive layout with centered content


### 5. Data Visualization and SQL Integration

- **Description**: Integration of data visualization capabilities and SQL query functionality. Via Realtime API Function calling.

- **Implementation Details**:

#### SQL Query Support:
- Server-side SQL query execution through dedicated API route
- Session-based query tracking with unique SQL session IDs
- Support for dynamic SQL query generation and execution
- Results integration into the conversation flow

#### Data Visualization Component:
- Dynamic chart generation using Recharts library
- Support for multiple chart types:
  - Bar charts
  - Line charts
  - Pie charts
  - Table view
- Automatic chart type selection based on data structure
- Responsive container design for optimal viewing



### Important Implementation Notes

- **Token Expiration**: Ephemeral tokens expire one minute after issuance. Ensure a new token is fetched for each session.
- **Error Handling**: Implement proper error handling for network issues and API failures.
- **Audio Processing**: PCM 16-bit format is used for both input and output audio.
- **Connection States**: Handle all WebRTC connection states properly for a robust user experience.
- **Microphone Access**: Request and manage microphone permissions appropriately.
