export default function Page() {
  fetch("http://localhost:3000/api/v1/auth/me", {
    credentials: "include"
  })
}
