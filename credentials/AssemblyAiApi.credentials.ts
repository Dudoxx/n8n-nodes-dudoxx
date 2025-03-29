import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AssemblyAiApi implements ICredentialType {
	name = 'assemblyAiApi'; // Will match the name in package.json n8n.credentials
	displayName = 'AssemblyAI API';
	documentationUrl = 'https://www.assemblyai.com/docs/concepts/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your AssemblyAI API Key',
		},
		// AssemblyAI SDK primarily uses the API key for authentication.
		// Base URL is generally not needed unless using a specific proxy or environment.
	];
}
