<?php

/**
 * Minimal .env loader — no external dependencies.
 * Reads KEY=VALUE pairs from the given file and exposes them via getenv() / $_ENV / $_SERVER.
 * Lines starting with # are comments. Values may be wrapped in single or double quotes.
 */

class Env
{
    private static $loaded = false;

    public static function load($path)
    {
        if (self::$loaded) return;
        if (!is_readable($path)) return;

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') continue;
            if (!str_contains($line, '=')) continue;

            list($name, $value) = explode('=', $line, 2);
            $name  = trim($name);
            $value = trim($value);

            // Strip surrounding quotes
            if (strlen($value) >= 2) {
                $first = $value[0];
                $last  = $value[strlen($value) - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            // Don't override values already set in the real environment
            if (getenv($name) === false) {
                putenv("$name=$value");
                $_ENV[$name]    = $value;
                $_SERVER[$name] = $value;
            }
        }

        self::$loaded = true;
    }
}
