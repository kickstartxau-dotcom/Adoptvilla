import React, { useEffect, useState } from "react";
import "./DogAssistant.css";

const initialMessages = [
  {
    role: "bot",
    text: "Hi, I'm Davo. 🐾 I'm your Adoptvilla Assistant. How can I help today?"
  }
];

async function askGemini(message, history) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-3.6-flash";

  if (!key || key === "your_gemini_api_key_here") {
    return "Davo's AI chat is not connected yet. Add VITE_GEMINI_API_KEY in your .env file.";
  }

  const prompt = `
You are Davo, the Adoptvilla Assistant.
Be warm, concise and welfare-first.
Help users take the right next step for adoption, rehoming, fostering, rescue and animal care.

${history.map(m => `${m.role}: ${m.text}`).join("\n")}

user: ${message}
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return "I couldn't answer just now. Please try again.";
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Please try again."
    );

  } catch (error) {
    console.error("Davo assistant error:", error);
    return "Sorry, I can't connect right now.";
  }
}


export default function DogAssistant() {

  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    agree: false
  });

  const [errors, setErrors] = useState({});
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };

  }, [open]);



  const validate = () => {

    const e = {};

    if (!form.name.trim())
      e.name = "Name is required";

    if (!/^\d{10}$/.test(form.phone))
      e.phone = "Enter valid 10 digit mobile number";

    if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter valid email";

    if (!form.agree)
      e.agree = "Please accept assistance consent";


    setErrors(e);

    return !Object.keys(e).length;
  };



  const send = async () => {

    if (!input.trim()) return;


    const updated = [
      ...messages,
      {
        role:"user",
        text:input.trim()
      }
    ];


    setMessages(updated);
    setInput("");
    setLoading(true);


    const reply = await askGemini(
      input.trim(),
      updated
    );


    setMessages([
      ...updated,
      {
        role:"bot",
        text:reply
      }
    ]);


    setLoading(false);

  };



  // Common open function
  const openDavo = () => {
    setOpen(true);
  };



  return (

    <>

      {/* FLOATING DAVO */}

      {!open && (

        <div className="davo-launcher">


          {/* CLICKABLE CHAT TEXT */}

          <div
            className="davo-launcher-copy"
            onClick={openDavo}
            role="button"
            tabIndex={0}
            onKeyDown={(e)=>{
              if(e.key==="Enter"){
                openDavo();
              }
            }}
          >

            <b>
              Hi, I’m Davo. 🐾
            </b>


            <span>
              I may not be in this world anymore,
              but I’m still here to help.
            </span>


            <em>
              Let’s chat →
            </em>


          </div>



          {/* CLICKABLE DOG */}

          <button
            className="davo-launch-button"
            onClick={openDavo}
            aria-label="Open Davo Assistant"
          >

            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            >

              <source
                src="/assets/dog/dog-assistant-alpha.mov"
                type="video/quicktime"
              />

              <source
                src="/assets/dog/dog-assistant-alpha.webm"
                type="video/webm"
              />

              <source
                src="/assets/dog/dog-assistant.webm"
                type="video/webm"
              />

            </video>

          </button>


        </div>

      )}




      {/* DAVO FORM MODAL */}

      {open && !started && (

        <div className="davo-modal-overlay">

          <div className="davo-modal">


            <button
              className="davo-close"
              onClick={()=>setOpen(false)}
            >
              ×
            </button>


            <span className="davo-eyebrow">
              ADOPTVILLA ASSISTANT
            </span>


            <h2>
              Hi, I’m Davo. 🐾
            </h2>


            <p className="davo-intro">
              <b>Your Adoptvilla Assistant.</b>
              <br/>
              I may not be in this world anymore,
              but I’m still here to help you.
            </p>


            <p className="davo-helper">
              Tell me a little about yourself and
              I’ll help you find the right next step.
            </p>



            <input
              placeholder="Full Name"
              value={form.name}
              onChange={
                e=>setForm({
                  ...form,
                  name:e.target.value
                })
              }
            />

            <small>
              {errors.name}
            </small>



            <div className="davo-phone-box">

              <span>
                +91
              </span>


              <input
                placeholder="Mobile Number"
                maxLength="10"
                value={form.phone}
                onChange={
                  e=>setForm({
                    ...form,
                    phone:e.target.value.replace(/\D/g,"")
                  })
                }
              />

            </div>


            <small>
              {errors.phone}
            </small>



            <input
              placeholder="Email Address"
              value={form.email}
              onChange={
                e=>setForm({
                  ...form,
                  email:e.target.value
                })
              }
            />

            <small>
              {errors.email}
            </small>



            <label className="davo-agree">

              <input
                type="checkbox"
                checked={form.agree}
                onChange={
                  e=>setForm({
                    ...form,
                    agree:e.target.checked
                  })
                }
              />

              I agree to receive assistance

            </label>


            <small>
              {errors.agree}
            </small>



            <button
              className="davo-continue"
              onClick={
                ()=>validate() && setStarted(true)
              }
            >
              Continue to Chat
            </button>


          </div>

        </div>

      )}




      {/* CHAT */}

      {open && started && (

        <div className="davo-full-chat">

          <div className="davo-chat-header">

            <div>
              <b>
                Davo · Adoptvilla Assistant
              </b>

              <span>
                Online
              </span>

            </div>


            <button
              onClick={()=>setOpen(false)}
            >
              ×
            </button>

          </div>



          <section className="davo-messages">

            {
              messages.map((m,i)=>(

                <div
                  key={i}
                  className={`davo-message ${m.role}`}
                >
                  {m.text}
                </div>

              ))
            }


            {
              loading &&
              <div className="davo-message bot">
                Thinking...
              </div>
            }


          </section>



          <footer className="davo-chat-footer">

            <input
              value={input}
              onChange={
                e=>setInput(e.target.value)
              }
              onKeyDown={
                e=>e.key==="Enter" && send()
              }
              placeholder="Type your message"
            />


            <button onClick={send}>
              ➤
            </button>


          </footer>


        </div>

      )}


    </>
  );
}