class CustomSuccess<T = unknown> {
  name: string;
  httpCode: number;
  message: string;
  data: T | null;
  success: boolean;
  meta?: Record<string, unknown>;

  static OK = 200;
  static CREATED = 201;
  static ACCEPTED = 202;
  static NO_CONTENT = 204;

  constructor(options: {
    name: string;
    httpCode: number;
    message: string;
    data?: T | null;
    meta?: Record<string, unknown>;
  }) {
    this.name = options.name;
    this.httpCode = options.httpCode;
    this.message = options.message;
    this.data = options.data ?? null;
    this.success = true;
    this.meta = options.meta;
  }
}

export class OkSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(
    data: T | null = null,
    message: string = 'Request completed successfully',
    meta?: Record<string, unknown>,
  ) {
    super({
      name: 'OK',
      httpCode: CustomSuccess.OK,
      message,
      data,
      meta,
    });
  }
}

export class CreatedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(
    data: T | null = null,
    message: string = 'Resource created successfully',
    meta?: Record<string, unknown>,
  ) {
    super({
      name: 'CREATED',
      httpCode: CustomSuccess.CREATED,
      message,
      data,
      meta,
    });
  }
}

export class AcceptedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(data: T | null = null, message: string = 'Request accepted', meta?: Record<string, unknown>) {
    super({
      name: 'ACCEPTED',
      httpCode: CustomSuccess.ACCEPTED,
      message,
      data,
      meta,
    });
  }
}

export class NoContentSuccess extends CustomSuccess<null> {
  constructor(message: string = 'No content', meta?: Record<string, unknown>) {
    super({
      name: 'NO_CONTENT',
      httpCode: CustomSuccess.NO_CONTENT,
      message,
      data: null,
      meta,
    });
  }
}

export default CustomSuccess;
