declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }

  export function toDataURL(
    text: string | Buffer,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toString(
    text: string | Buffer,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | Buffer,
    options?: QRCodeOptions
  ): Promise<void>;
}
