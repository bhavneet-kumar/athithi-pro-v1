class CustomSuccess<T = unknown> {
  name: string;
  httpCode: number;
  message: string;
  data: T | null;
  success: boolean;

  static OK = 200;
  static CREATED = 201;
  static ACCEPTED = 202;
  static NO_CONTENT = 204;

  constructor(name: string, httpCode: number, message: string, data: T | null = null) {
    this.name = name;
    this.httpCode = httpCode;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}
//test

export class OkSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(data: T | null = null, message: string = 'Request completed successfully') {
    super('OK', CustomSuccess.OK, message, data);
  }
}

export class CreatedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(data: T | null = null, message: string = 'Resource created successfully') {
    super('CREATED', CustomSuccess.CREATED, message, data);
  }
}

export class AcceptedSuccess<T = unknown> extends CustomSuccess<T> {
  constructor(data: T | null = null, message: string = 'Request accepted') {
    super('ACCEPTED', CustomSuccess.ACCEPTED, message, data);
  }
}

export class NoContentSuccess extends CustomSuccess<null> {
  constructor(message: string = 'No content') {
    super('NO_CONTENT', CustomSuccess.NO_CONTENT, message, null);
  }
}

export default CustomSuccess;
