const express = require("express");
const app = express();
const cors = require("cors");
const fs = require("fs");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = JSON.parse(fs.readFileSync("./address.json", "utf-8"));

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { data, hashedMessage, sign } = req.body;

  const sender = data.sender;
  const amount = data.amount;
  setInitialBalance(data.sender);
  setInitialBalance(data.recipient);

  const isValid = isValidTransaction(messageHash, sign, sender);
  if (!isValid) {
    res.status(400).send({ message: "Not a valid Sender" });
  }

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.use("/", (req, res) => {
  res.send("Nothing Here!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

function isValidTransaction(messageHash, sign, sender) {
  const signature = Uint8Array.from(Object.values(sign[0]));
  const recoveryBit = sign[1];

  const recoveredPublicKey = secp.recoverPublicKey(
    messageHash,
    signature,
    recoveryBit
  );

  const isSigned = secp.verify(signature, messageHash, recoveredPublicKey);

  const isValidSender =
    sender.slice(2).toString() ===
    toHex(recoveredPublicKey.slice(1).slice(-20)).toString()
      ? true
      : false;

  if (isValidSender && isSigned) return true;

  return false;
}
