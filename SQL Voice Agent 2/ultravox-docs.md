SDK
Ultravox Client SDK
The Ultravox REST API is used to create calls but you must use one of the Ultravox client SDKs to join and end calls. This page primarily uses examples in JavaScript. The concepts are the same across all the different SDK implementations.

​
Methods
The core of the SDK is the UltravoxSession. The session is used to join and leave calls. The UltravoxSession contains methods for:

Joining/leaving a call
Sending text messages to the agent
Changing the output medium for how the agent replies
Registering client tools
Muting the microphone/speaker
​
joinCall()
Joins a call.


joinCall(joinUrl: string, clientVersion?: string): void
​
joinUrl
string
required
The joinUrl that was returned from the Create Call request.

​
clientVersion
string
Optional string that can be used for application version tracking. Will be appended to the call and be available in the clientVersion field in the Get Call response.

​
leaveCall()
Leaves the current call. Returns a promise (with no return value) that resolves when the call has successfully been left.


async leaveCall(): Promise<void>
​
sendText()
Sends a text message to the agent.


sendText(text: string): void
​
text
string
required
The message to send to the agent.

​
setOutputMedium()
Sets the agent’s output medium for future utterances. If the agent is currently speaking, this will take effect at the end of the agent’s utterance.


setOutputMedium(medium: Medium): void
​
medium
Medium
required
How replies are communicated. Must be either 'text' or 'voice'.

Also see muteSpeaker and unmuteSpeaker below.

​
registerToolImplementation()
Registers a client tool implementation with the given name. If the call is started with a client-implemented tool, this implementation will be invoked when the model calls the tool.


registerToolImplementation(name: string, implementation: ClientToolImplementation): void
​
name
string
required
The name of the tool. Must match what is defined in selectedTools during Create Call.

If nameOverride is set then must match that name. Otherwise must match modelToolName.

​
implementation
ClientToolImplementation
required
The function that implements the tool’s logic. This is a function that:

Accepts parameters → An object containing key-value pairs for the tool’s parameters. The keys will be strings.

Returns → Either a string result, or an object with a result string and a responseType, or a Promise that resolves to one of these.

For example:


  const stock_price = (parameters) => {
    ...  // to be implemented
    return `Stock price is ${value}`;
  };
​
registerToolImplementations()
Convenience batch wrapper for registerToolImplementation.


registerToolImplementations(implementationMap: { [name: string]: ClientToolImplementation }): void 
​
implementationMap
Object
required
An object where each key (a string) represents the name of the tool and each value is a ClientToolImplementation function.

​
isMicMuted()
Returns a boolen indicating if the end user’s microphone is muted. This is scoped to the Ultravox SDK and does not detect muting done by the user outside of your application.


isMicMuted(): boolean
​
isSpeakerMuted()
Returns a boolen indicating if the speaker (the agent’s voice output) is muted. This is scoped to the Ultravox SDK and does not detect muting done by the user outside of your application.


isSpeakerMuted(): boolean
​
muteMic()
Mutes the end user’s microphone. This is scoped to the Ultravox SDK.


muteMic(): void
​
unmuteMic()
Unmutes the end user’s microphone. This is scoped to the Ultravox SDK.


unmuteMic(): void
​
muteSpeaker()
Mutes the end user’s speaker (the agent’s voice output). This is scoped to the Ultravox SDK.


muteSpeaker(): void
​
unmuteSpeaker()
Unmutes the end user’s speaker (the agent’s voice output). This is scoped to the Ultravox SDK.


unmuteSpeaker(): void
​
Client Tools
Ultravox has robust support for tools. The SDK has support for client tools. Client tools will be invoked in your client code and enable you to add interactivity in your app that is driven by user interactions with your agent. For example, your agent could choose to invoke a tool that would trigger some UI change.

Message Size Limit
Messages larger than 15-16KB may cause timeouts. Keep payload sizes within this limit.


Creating Client Tools
Client tools are defined just like “server” tools with three exceptions:

1
'client' not 'http'

You don’t add the URL and HTTP method for client tools.

Instead, you add "client": {} to the tool definition.


Using a Client Tool

Using a Server Tool

{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "temporaryTool": {
      "modelToolName": "stock_price",
      "description": "Get the current stock price for a given symbol",
      "dynamicParameters": [
        {
          "name": "symbol",
          "location": "PARAMETER_LOCATION_QUERY",
          "schema": {
            "type": "string",
            "description": "Stock symbol (e.g., AAPL for Apple Inc.)"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": "https://api.stockmarket.com/v1/price",
        "httpMethod": "GET"
      }
    }
  ]
}
2
Register Tool with Client

Your client tool must be registered in your client code. Here’s a snippet that might be found in client code to register the client tool and implement the logic for the tool.

See the SDK method registerToolImplementation() for more information.

Registering a Client Tool

// Start up our Ultravox Session
uvSession = new UltravoxSession();

// Register our client-side tool
uvSession.registerToolImplementation(
  "stock_price",
  stock_price
);

uvSession.joinCall(joinUrl);

// Function that implements tool logic
const stock_price = (parameters) => {
  ...  // to be implemented
  return `Stock price is ${value}`;
};
3
Only Body Parameters Allowed

Unlike server tools (which accept parameters passed by path, header, body, etc.), client tools only allow parameters to be passed in the body of the request. That means client tools will always have parameter location set like this:


"location": "PARAMETER_LOCATION_BODY"
​
Session Status
The UltravoxSession exposes status. Based on the UltravoxSessionStatus enum, status can be one of the following:

status	description
disconnected	Session is not connected. This is the initial state prior to joinCall.
disconnecting	Session is in the process of disconnecting.
connecting	Session is establishing the connection.
idle	Session is connected but not yet active.
listening	Listening to the end user.
thinking	The model is processing/thinking.
speaking	The model is speaking.
Status Events
The status can be retrieved by adding an event listener to the session status.

Get Session Status Events

// Listen for status changing events
session.addEventListener('status', (event) => {
  console.log('Session status changed: ', session.status);
});
​
Transcripts
Sometimes you may want to augment the audio with text transcripts (e.g. if you want to show the end user the model’s output in real-time). Transcripts can be retrieved by adding an event listener:

Get Transcripts

// Listen for transcripts changing events
session.addEventListener('transcripts', (event) => {
  console.log('Transcripts updated: ', session.transcripts);
});
Transcripts are returned as an array of transcript objects.

​
transcript
Transcript Object

Hide properties

​
text
string
Text transcript of the speech from the end user or the agent.

​
isFinal
boolean
True if the transcript represents a complete utterance. False if it is a fragment of an utterance that is still underway.

​
speaker
Role
Either “user” or “agent”. Denotes who was speaking.

​
medium
Medium
Either “voice” or “text”. Denotes how the message was sent.

​
Debug Messages
No Guarantee
Debug messages from Ultravox should be treated as debug logs. They can change regularly and don’t have a contract. Relying on the specific structure or content should be avoided.

The UltravoxSession object also provides debug messages. Debug messages must be enabled when creating a new session and then are available via an event listener similar to status and transcripts:

Get Debug Messages

// Listen for debug messages
session.addEventListener('experimental_message', (msg) => {
  console.log('Got a debug message: ', JSON.stringify(msg));
});
Debug Message: Tool Call
When the agent invokes a tool, the message contains the function, all arguments, and an invocation ID:


LLM response: Tool calls: [FunctionCall(name='createProfile', args='{"firstName":"Ron","lastName":"Burgandy","organization":"Fixie.ai","useCase":"creating a talking AI news reporter"}', invocation_id='call_D2qQVS8OQc998aMEw5PRa9cF')]
Debug Message: Tool Call Result
When the tool call completes, the message contains an array of messages. Multiple tools can be invoked by the model. This message array will conatain all the calls followed by all the results. These messages are also available via List Call Messages.

Here’s an example of what we might see from a single tool invocation:


Tool call complete.

Result: [
  role: MESSAGE_ROLE_TOOL_CALL ordinal: 6 text: "{\"firstName\":\"Ron\",\"lastName\":\"Burgandy\",\"organization\":\"Fixie.ai\",\"useCase\":\"creating a talking AI news reporter\"}" tool_name: "createProfile" invocation_id: "call_D2qQVS8OQc998aMEw5PRa9cF" tool_id: "aa737e12-0989-4adb-9895-f387f40557d8" ,
  role: MESSAGE_ROLE_TOOL_RESULT ordinal: 7 text: "{\"firstName\":\"Ron\",\"lastName\":\"Burgandy\",\"emailAddress\":null,\"organization\":\"Fixie\",\"useCase\":\"creating a talking AI news reporter\"}" tool_name: "createProfile" invocation_id: "call_D2qQVS8OQc998aMEw5PRa9cF" tool_id: "aa737e12-0989-4adb-9895-f387f40557d8"
]
​

The definition object in the tool creation and update requests follows the BaseToolDefinition schema.

Here’s a breakdown of its main components:

description (string): A clear, concise description of what the tool does.
dynamicParameters (array, optional): List of parameters that can be set by the AI model when using the tool. Each parameter is an object containining:
name (string): The name of the parameter.
location (string): Where the parameter is used (“PARAMETER_LOCATION_QUERY”, “PARAMETER_LOCATION_PATH”, “PARAMETER_LOCATION_HEADER”, “PARAMETER_LOCATION_BODY”).
schema (object): JSON Schema definition of the parameter. This typically includes things like type, description, enum values, format, other restrictions, etc.
required (boolean): Whether the parameter is required.
staticParameters (array, optional): List of parameters that are always set to a known, fixed value when the tool is used. These are unconditionally added when the tool is invoked. These parameters are not exposed to or set by the model. Example: you use an API for various things but want to track which requests come from your Ultravox app so you always append utm=ultravox to the query parameters.
automaticParameters (array, optional): Additional parameters automatically set by the system. Used when the value is not known when the tool is created but that will be known when the tool is called. Example: you want to use the unique call_id from ultravox as a key in your backend and you have the tool include call_id in the request body when your tool’s API is called.
requirements (object, optional): Any specific requirements for using the tool. Currently this is used for security (e.g. API keys or HTTP Auth).
http (object): Details for invoking the tool via HTTP. For server tools.
baseUrlPattern (string): The base URL pattern for the tool, possibly with placeholders for path parameters.
httpMethod (string): The HTTP method for the tool (e.g., “GET”, “POST”).
client (object): Declares the tool as a client tool. Exactly one of http or client must be set for a tool.
