<?php

class Response
{
    public static function json($data, $code = 200)
    {
        http_response_code($code);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($data, $message = 'Success', $code = 200)
    {
        self::json([
            'status'  => true,
            'message' => $message,
            'data'    => $data
        ], $code);
    }

    public static function error($message = 'Error', $code = 400)
    {
        self::json([
            'status'  => false,
            'message' => $message,
            'data'    => null
        ], $code);
    }

    public static function created($data, $message = 'Created successfully')
    {
        self::success($data, $message, 201);
    }

    public static function notFound($message = 'Resource not found')
    {
        self::error($message, 404);
    }

    public static function unauthorized($message = 'Unauthorized')
    {
        self::error($message, 401);
    }

    public static function validationError($message = 'Validation failed')
    {
        self::error($message, 422);
    }
}
