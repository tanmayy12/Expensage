import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const JoinGroup = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "joining" | "success" | "error" | "already" | "notfound">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      // Not logged in, redirect to auth, then back here
      navigate(`/auth?redirect=/groups/join/${inviteToken}`);
      return;
    }
    if (!inviteToken) {
      setStatus("notfound");
      setMessage("Invalid invite link.");
      return;
    }
    setStatus("joining");
    fetch(`http://localhost:4000/api/groups/join/${inviteToken}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 400) {
          setStatus("already");
          setMessage("You are already a member of this group.");
        } else if (res.status === 404) {
          setStatus("notfound");
          setMessage("Invalid or expired invite link.");
        } else if (res.ok) {
          setStatus("success");
          setMessage("You have joined the group!");
          setTimeout(() => navigate("/", { replace: true }), 1500);
        } else {
          setStatus("error");
          setMessage("Failed to join group. Please try again.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Failed to join group. Please try again.");
      });
  }, [inviteToken, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#1a1333] via-[#1a183a] to-[#1a1a2e]">
      <Card className="glass-card p-8 max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>Join Group</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "joining" && <div>Joining group...</div>}
          {status === "success" && <div className="text-green-500 font-semibold">{message}</div>}
          {status === "already" && <div className="text-blue-400 font-semibold">{message}</div>}
          {status === "notfound" && <div className="text-red-500 font-semibold">{message}</div>}
          {status === "error" && <div className="text-red-500 font-semibold">{message}</div>}
          {(status === "already" || status === "notfound" || status === "error") && (
            <Button className="mt-4" onClick={() => navigate("/")}>Go to Dashboard</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinGroup; 