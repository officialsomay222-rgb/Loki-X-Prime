import { registerPlugin } from '@capacitor/core';

export interface AssistantSettingsPlugin {
  openAssistantSettings(): Promise<void>;
}

const AssistantSettings = registerPlugin<AssistantSettingsPlugin>('AssistantSettings');

export default AssistantSettings;
