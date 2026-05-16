<?php

class Database
{
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct()
    {
        $this->host     = getenv('DB_HOST')     ?: 'localhost';
        $this->port     = getenv('DB_PORT')     ?: '3308';
        $this->db_name  = getenv('DB_NAME')     ?: 'bay_bakers';
        $this->username = getenv('DB_USERNAME')  ?: 'root';
        $this->password = getenv('DB_PASSWORD')  ?: '';
    }

    public function getConnection()
    {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }

        return $this->conn;
    }
}
