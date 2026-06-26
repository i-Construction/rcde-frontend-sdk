"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Link from "next/link";

type LoginErrorProps = {
  message: string;
};

export function LoginError({ message }: LoginErrorProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            frontend-sdk example
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            RCDE Frontend SDK サンプルアプリケーション
          </Typography>

          <Alert severity="error" sx={{ mb: 2 }}>
            {message}
          </Alert>

          <Link href="/login" style={{ textDecoration: "none" }}>
            <Button variant="contained" size="large" fullWidth>
              再試行
            </Button>
          </Link>
        </CardContent>
      </Card>
    </Box>
  );
}
