import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

/**
 * Maps thrown exceptions to their HTTP status + body.
 *
 * Why this exists in the example (not the lib): these example apps wire the
 * library via a local `file:` dependency, which symlinks rhino-nestjs in with
 * its OWN copy of `@nestjs/common`. The library's `RhinoException extends
 * HttpException` is therefore an instance of the LIBRARY's HttpException class,
 * not the app's — so Nest's built-in handler fails its `instanceof HttpException`
 * check and returns a generic 500. A published (single-copy) install would not
 * hit this. We duck-type on `getStatus()`/`getResponse()` so any HttpException
 * from either realm is serialized with the correct status.
 */
@Catch()
export class RhinoExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    const ex = exception as any;
    const isHttp =
      exception instanceof HttpException ||
      (ex && typeof ex.getStatus === 'function' && typeof ex.getResponse === 'function');

    if (isHttp) {
      const status = ex.getStatus();
      const body = ex.getResponse();
      return res.status(status).json(body);
    }

    // eslint-disable-next-line no-console
    console.error('Unhandled exception:', exception);
    return res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}
