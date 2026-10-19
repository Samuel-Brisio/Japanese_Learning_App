export interface StructuredTextElement {
  type: string;
  content: string;
  reading?: string;
  canonicalWordId?: string;
  wordId?: string;
}

export interface StructuredTextSection {
  content: string;
  elements: StructuredTextElement[];
}

export interface StructuredText {
  language: string;
  title: StructuredTextSection;
  sentences: StructuredTextSection[];
}

export interface TextProps {
  id: string;
  ownerId: string;
  processingId: string;
  text: StructuredText;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Text {
  private constructor(private readonly props: TextProps) {}

  static create(
    props: Omit<TextProps, 'id' | 'version' | 'createdAt' | 'updatedAt'> & {
      id: string;
      now?: Date;
    },
  ): Text {
    const now = props.now ?? new Date();

    Text.validateStructuredText(props.text);

    return Text.restore({
      ...props,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static validateStructuredTextElement(element: StructuredTextElement): void {
    if (!element || typeof element.type !== 'string' || !element.type.trim()) {
      throw new Error('Text element type cannot be empty');
    }
    if (
      !element ||
      typeof element.content !== 'string' ||
      !element.content.trim()
    ) {
      throw new Error('Text element content cannot be empty');
    }

    if (element.type === 'word') {
      if (!element.canonicalWordId) {
        throw new Error(
          'Text element canonicalWordId is required for type "word"',
        );
      }
      if (!element.wordId) {
        throw new Error('Text element wordId is required for type "word"');
      }
      if (!element.reading) {
        throw new Error('Text element reading is required for type "word"');
      }
    }
  }

  static validateStructuredTextSection(section: StructuredTextSection): void {
    if (
      !section ||
      typeof section.content !== 'string' ||
      !section.content.trim()
    ) {
      throw new Error('Text section content cannot be empty');
    }

    if (!Array.isArray(section.elements) || !section.elements.length) {
      throw new Error('Text section elements are required');
    }
    section.elements.forEach((element) => {
      Text.validateStructuredTextElement(element);
    });
  }

  static validateStructuredText(text: StructuredText): void {
    if (!text || typeof text.language !== 'string' || !text.language.trim()) {
      throw new Error('Text language is required');
    }

    if (!text.title) {
      throw new Error('Text title is required');
    }
    Text.validateStructuredTextSection(text.title);

    if (!Array.isArray(text.sentences) || !text.sentences.length) {
      throw new Error('Text sentences are required');
    }
    text.sentences.forEach((sentence) => {
      Text.validateStructuredTextSection(sentence);
    });
  }

  static restore(props: TextProps): Text {
    if (props.version < 1) {
      throw new Error('Text version must be at least 1');
    }

    return new Text(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get text(): StructuredText {
    return this.props.text;
  }

  get processingId(): string {
    return this.props.processingId;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
