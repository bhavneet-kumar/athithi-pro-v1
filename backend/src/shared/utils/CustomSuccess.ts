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

  constructor(name: string, httpCode: number, message: string, data: T | null = null, meta?: Record<string, unknown>) {
    this.name = name;
    this.httpCode = httpCode;
    this.message = message;
    this.data = data;
    this.success = true;
    this.meta = meta;
  }
}
//test

export class OkSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(
    data: T | null = null,
    message: string = 'Request completed successfully',
    meta?: Record<string, unknown>,
  ) {
    super('OK', CustomSuccess.OK, message, data, meta);
  }
}

export class CreatedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(
    data: T | null = null,
    message: string = 'Resource created successfully',
    meta?: Record<string, unknown>,
  ) {
    super('CREATED', CustomSuccess.CREATED, message, data, meta);
  }
}

export class AcceptedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(data: T | null = null, message: string = 'Request accepted', meta?: Record<string, unknown>) {
    super('ACCEPTED', CustomSuccess.ACCEPTED, message, data, meta);
  }
}

export class NoContentSuccess extends CustomSuccess<null> {
  constructor(message: string = 'No content', meta?: Record<string, unknown>) {
    super('NO_CONTENT', CustomSuccess.NO_CONTENT, message, null, meta);
  }
}

export default CustomSuccess;
