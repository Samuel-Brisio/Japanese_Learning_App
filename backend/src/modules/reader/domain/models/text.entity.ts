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

  static create(props: Omit<TextProps, 'id' | 'version' | 'createdAt' | 'updatedAt'> & {
    id: string;
    now?: Date;
  }): Text {
    const now = props.now ?? new Date();

    return Text.restore({
      ...props,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: TextProps): Text {
    if (!props.text.title.content.trim() && !props.text.sentences) {
      throw new Error('Text original content cannot be empty');
    }

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