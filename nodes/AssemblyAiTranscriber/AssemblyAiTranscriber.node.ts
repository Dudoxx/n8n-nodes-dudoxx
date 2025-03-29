import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	INodeProperties,
	IBinaryData,
	IBinaryKeyData,
	NodeConnectionType,
} from 'n8n-workflow';
import { AssemblyAI, SpeechModel } from 'assemblyai'; // Import the SDK and types
import { Readable } from 'stream'; // Import Readable stream type

export class AssemblyAiTranscriber implements INodeType {
	description: INodeTypeDescription = { // Explicitly typed
		displayName: 'AssemblyAI Transcriber',
		name: 'assemblyAiTranscriber', // Will match package.json
		icon: 'file:assemblyai.svg', // SVG icon for the node
		group: ['transform', 'ai'], // Example groups
		version: 1,
		description: 'Transcribes audio using AssemblyAI API',
		defaults: {
			name: 'AssemblyAI Transcriber',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'assemblyAiApi', // Must match the credential name
				required: true,
			},
		],
		properties: [
			// Define node properties here
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Transcribe Audio',
						value: 'transcribe',
						description: 'Submit audio for transcription',
						action: 'Transcribe audio',
					},
					// Future operations like 'Get Transcript Status' could be added here
				],
				default: 'transcribe',
				required: true,
			},

			// --- Properties for 'transcribe' operation ---
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
						description: 'Provide a publicly accessible URL to the audio file',
					},
					{
						name: 'Binary Data',
						value: 'binary',
						description: 'Use audio data from a previous node',
					},
				],
				default: 'url',
				required: true,
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
				description: 'Where to get the audio from',
			},
			{
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				default: 'https://dpgr.am/spacewalk.wav',
				required: true,
				displayOptions: {
					show: {
						operation: ['transcribe'],
						source: ['url'],
					},
				},
				placeholder: 'https://example.com/audio.mp3',
				description: 'Publicly accessible URL of the audio file to transcribe',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['transcribe'],
						source: ['binary'],
					},
				},
				description: 'Name of the binary property containing the audio data',
			},
			// Model selection
			{
				displayName: 'Speech Model',
				name: 'speech_model',
				type: 'options',
				options: [
					{ 
						name: 'Best', 
						value: 'best',
						description: 'Use our most accurate and capable models with the best results, recommended for most use cases.',
					},
					{ 
						name: 'Nano', 
						value: 'nano',
						description: 'Use our less accurate, but much lower cost models to produce your results.',
					},
				],
				default: 'best',
				description: 'The speech model to use for transcription. Visit pricing page for more information on model tiers.',
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
			},
			
			// Output options
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{
						name: 'Full Response',
						value: 'full',
						description: 'Output the complete response object from AssemblyAI',
					},
					{
						name: 'Transcript Text Only',
						value: 'textOnly',
						description: 'Output only the transcript text',
					},
				],
				default: 'full',
				description: 'Choose the desired output format',
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
			},
			{
				displayName: 'Transcript Field Name',
				name: 'transcriptFieldName',
				type: 'string',
				default: 'text',
				required: true,
				displayOptions: {
					show: {
						operation: ['transcribe'],
						outputFormat: ['textOnly'],
					},
				},
				description: 'Name of the JSON field to store the transcript text in when "Transcript Text Only" format is selected',
			},
			
			// Additional options
			{
				displayName: 'Additional Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['transcribe'],
					},
				},
				options: [
					{
						displayName: 'Language Code',
						name: 'language_code',
						type: 'string',
						default: '',
						placeholder: 'en_us',
						description: 'Language code of the audio (e.g., en_us, es, fr). See AssemblyAI docs for supported codes.',
					},
					{
						displayName: 'Language Detection',
						name: 'language_detection',
						type: 'boolean',
						default: false,
						description: 'Automatically detect the language spoken in the audio file',
					},
					{
						displayName: 'Language Confidence Threshold',
						name: 'language_confidence_threshold',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.5,
						description: 'The confidence threshold for the automatically detected language (0-1)',
						displayOptions: {
							show: {
								language_detection: [true],
							},
						},
					},
					{
						displayName: 'Speaker Labels',
						name: 'speaker_labels',
						type: 'boolean',
						default: false,
						description: 'Whether to enable speaker diarization',
					},
					{
						displayName: 'Speakers Expected',
						name: 'speakers_expected',
						type: 'number',
						typeOptions: {
							minValue: 1,
							maxValue: 10,
						},
						default: 2,
						description: 'Number of speakers expected in the audio (1-10)',
						displayOptions: {
							show: {
								speaker_labels: [true],
							},
						},
					},
					{
						displayName: 'Punctuate',
						name: 'punctuate',
						type: 'boolean',
						default: true,
						description: 'Whether to add punctuation and capitalization',
					},
					{
						displayName: 'Format Text',
						name: 'format_text',
						type: 'boolean',
						default: true,
						description: 'Whether to format numbers, dates, and other values',
					},
					{
						displayName: 'Multichannel',
						name: 'multichannel',
						type: 'boolean',
						default: false,
						description: 'Whether to transcribe each audio channel separately',
					},
					{
						displayName: 'Word Boost',
						name: 'word_boost',
						type: 'string',
						default: '',
						placeholder: 'word1,word2,phrase 1',
						description: 'Comma-separated list of words or phrases to boost in the transcription',
					},
					{
						displayName: 'Boost Parameter',
						name: 'boost_param',
						type: 'options',
						options: [
							{ name: 'Low', value: 'low' },
							{ name: 'Default', value: 'default' },
							{ name: 'High', value: 'high' },
						],
						default: 'default',
						// Only show this option when word_boost is used
						description: 'How much to boost the specified words',
					},
					{
						displayName: 'Filter Profanity',
						name: 'filter_profanity',
						type: 'boolean',
						default: false,
						description: 'Whether to filter profanity from the transcript',
					},
					{
						displayName: 'Redact PII',
						name: 'redact_pii',
						type: 'boolean',
						default: false,
						description: 'Whether to redact personally identifiable information',
					},
					{
						displayName: 'Redact PII Audio',
						name: 'redact_pii_audio',
						type: 'boolean',
						default: false,
						description: 'Generate a copy of the original media file with spoken PII "beeped" out',
						displayOptions: {
							show: {
								redact_pii: [true],
							},
						},
					},
					{
						displayName: 'Redact PII Audio Quality',
						name: 'redact_pii_audio_quality',
						type: 'options',
						options: [
							{ name: 'MP3', value: 'mp3' },
							{ name: 'WAV', value: 'wav' },
						],
						default: 'mp3',
						description: 'Controls the filetype of the audio created by redact_pii_audio',
						displayOptions: {
							show: {
								redact_pii_audio: [true],
							},
						},
					},
					{
						displayName: 'Disfluencies',
						name: 'disfluencies',
						type: 'boolean',
						default: false,
						description: 'Whether to include filler words like "um", "uh", etc.',
					},
					{
						displayName: 'Audio Start From',
						name: 'audio_start_from',
						type: 'number',
						default: 0,
						description: 'The point in time, in milliseconds, to begin transcribing in your media file',
					},
					{
						displayName: 'Audio End At',
						name: 'audio_end_at',
						type: 'number',
						default: 0,
						description: 'The point in time, in milliseconds, to stop transcribing in your media file',
					},
					{
						displayName: 'Speech Threshold',
						name: 'speech_threshold',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
						},
						default: 0.2,
						description: 'Reject audio files that contain less than this fraction of speech (0-1)',
					},
					{
						displayName: 'Webhook URL',
						name: 'webhook_url',
						type: 'string',
						default: '',
						placeholder: 'https://your-webhook-url.com',
						description: 'URL to receive a webhook when the transcription is complete',
					},
					{
						displayName: 'Webhook Auth Header Name',
						name: 'webhook_auth_header_name',
						type: 'string',
						default: '',
						description: 'The header name to be sent with the webhook requests',
					},
					{
						displayName: 'Webhook Auth Header Value',
						name: 'webhook_auth_header_value',
						type: 'string',
						default: '',
						description: 'The header value to send with the webhook requests for added security',
					},
				],
			},
		],
	};

	// The execute method will be defined here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('assemblyAiApi');
		const operation = this.getNodeParameter('operation', 0, 'transcribe') as string;

		const client = new AssemblyAI({ apiKey: credentials.apiKey as string });

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const source = this.getNodeParameter('source', itemIndex, 'url') as string;
				const options = this.getNodeParameter('options', itemIndex, {}) as Record<string, any>;
				let audioSource: any; // Temporarily simplify type hint

				if (operation === 'transcribe') {
					// Get model and output format
					const speechModel = this.getNodeParameter('speech_model', itemIndex, 'best') as string;
					const outputFormat = this.getNodeParameter('outputFormat', itemIndex, 'full') as string;
					
					// --- Get Audio Source ---
					if (source === 'url') {
						audioSource = this.getNodeParameter('audioUrl', itemIndex, '') as string;
						if (!audioSource) {
							throw new NodeOperationError(this.getNode(), 'Audio URL is required when source is URL.', { itemIndex });
						}
					} else { // source === 'binary'
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
						// Assert that binary data exists and get a reference to it
						const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
						
						// Log binary data information for debugging
						console.log(`Processing binary data: ${binaryData.fileName || 'unnamed'}, MIME type: ${binaryData.mimeType}, size: ${binaryData.fileSize} bytes`);
						
						// Get the actual buffer to pass to the API
						audioSource = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
					}

					// --- Submit Transcription Job ---
					// Start timer for performance tracking
					const startTime = Date.now();
					
					let transcript;
					
					// Prepare options with the speech model
					const transcriptionOptions = {
						...options,
					};
					
					// Only add speech_model if it's specified
					if (speechModel) {
						// Cast to any to avoid TypeScript errors with the SDK types
						(transcriptionOptions as any).speech_model = speechModel;
					}
					
					if (source === 'url') {
						// For URL source, we need to pass the URL directly
						transcript = await client.transcripts.transcribe({
							audio: audioSource,
							...transcriptionOptions, // Spread additional options
						});
					} else {
						// For binary data, we pass the buffer directly
						transcript = await client.transcripts.transcribe({
							audio: audioSource,
							...transcriptionOptions, // Spread additional options
						});
					}

					// Calculate duration
					const endTime = Date.now();
					const durationMs = endTime - startTime;

					if (transcript.status === 'error') {
						throw new NodeOperationError(this.getNode(), `AssemblyAI transcription failed: ${transcript.error}`, { itemIndex });
					}

					// Process output based on selected format
					let outputJson: any = {}; // Create a clean output object
					
					if (outputFormat === 'textOnly') {
						// Get the custom field name for the transcript text
						const transcriptFieldName = this.getNodeParameter('transcriptFieldName', itemIndex, 'text') as string;
						const fieldName = transcriptFieldName.trim() || 'text'; // Default to 'text' if empty
						
						// For text-only output, just return the transcript text as the entire output
						outputJson = {
							[fieldName]: transcript.text || '',
							// Include minimal metadata
							metadata: {
								duration_ms: durationMs,
								speech_model: speechModel,
								audio_duration: transcript.audio_duration,
								confidence: transcript.confidence,
								// Add source information
								source: source === 'url' ? 'url' : 'binary',
								// Add file information if binary
								...(source === 'binary' ? {
									file_info: {
										name: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).fileName || 'unnamed',
										mime_type: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).mimeType,
										size: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).fileSize,
									}
								} : {
									url: audioSource
								})
							}
						};
					} else { // outputFormat === 'full'
						// Include the full transcript response with original data
						outputJson = {
							...items[itemIndex].json,
							assemblyAiTranscription: transcript,
							assemblyAiMetadata: {
								speech_model: speechModel,
								options,
								durationMs,
								// Add source information
								source: source === 'url' ? 'url' : 'binary',
								// Add file information if binary
								...(source === 'binary' ? {
									file_info: {
										name: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).fileName || 'unnamed',
										mime_type: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).mimeType,
										size: this.helpers.assertBinaryData(itemIndex, this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string).fileSize,
									}
								} : {
									url: audioSource
								})
							}
						};
					}

					// Return the processed data
					returnData.push({ json: outputJson, pairedItem: { item: itemIndex } });

				} else {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`, { itemIndex });
				}

			} catch (error) {
				let errorMessage = 'An unknown error occurred';
				if (error instanceof Error) {
					errorMessage = error.message;
				}
				// Add more specific error handling for AssemblyAI SDK errors if possible

				if (this.continueOnFail()) {
					returnData.push({ json: { error: errorMessage }, pairedItem: { item: itemIndex } });
					continue;
				}
				// Include original error message if available
				const detailedErrorMessage = error instanceof Error ? `${errorMessage}: ${error.message}` : errorMessage;
				throw new NodeOperationError(this.getNode(), detailedErrorMessage, { itemIndex });
			}
		}

		return [returnData];
	}
}
