export interface AssistantSettingsPlugin {
  openAssistantSettings(): Promise<void>;
}

const AssistantSettings: AssistantSettingsPlugin = {
  openAssistantSettings: async () => {
    console.warn('AssistantSettings plugin is natively handled or mocked.');
  }
};

export default AssistantSettings;
