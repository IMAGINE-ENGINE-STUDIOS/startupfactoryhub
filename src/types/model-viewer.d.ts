declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        'ios-src'?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'environment-image'?: string;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        poster?: string;
      },
      HTMLElement
    >;
  }
}
