declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: JitsiMeetOptions
    ) => JitsiMeetAPI;
  }
}

interface JitsiMeetOptions {
  roomName: string;
  width?: string | number;
  height?: string | number;
  parentNode?: HTMLElement;
  configOverwrite?: any;
  interfaceConfigOverwrite?: any;
}

interface JitsiMeetAPI {
  on(event: string, listener: (...args: any[]) => void): void;
  executeCommand(command: string, ...args: any[]): void;
  dispose(): void;
  getNumberOfParticipants(): number;
}

export {};
