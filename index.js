const dgram = require("dgram");

const port = 3000;
const address = process.argv[2];

const clients = [];


const transmission  = (message, sendingUser, options) => {
  const clientsToSend = sendingUser
    ? clients.filter(
        (userClient) =>
          userClient.address != sendingUser.address ||
          userClient.port != sendingUser.port
      )
    : clients;

  clientsToSend.map((client, index) => {
    if (options?.closeServerAfterSend && clients.length == index) {
      return oneMessage(message, client, () => {
        server.close();
        console.log(`Server encerrado por ${sendingUser?.author}`);
      });
    }

    oneMessage(message, client);
  });
};

function oneMessage(msg, userClient, functionCallback) {
  const msgBuffered = Buffer.from(JSON.stringify(msg));

  return server.send(
    msgBuffered,
    0,
    msgBuffered.length,
    userClient.port,
    userClient.address,
    functionCallback
  );
}

const server = dgram.createSocket("udp4");

server.bind({
  address,
  port,
});

server.on("message", (message, rinfo) => {
  const messageServer = JSON.parse(String(message));

  const client = clients.find(
    (client) => client.address == rinfo.address && client.port == rinfo.port
  );

  switch (messageServer.type) {
    case "conexao":
      const newClient = { author: messageServer.author, ...rinfo };
      clients.push(newClient);
      transmission(
        {
          type: "novaConexao",
          client: newClient,
        },
        newClient
      );

      const connectionInfo = {
        type: "conexaoFeita",
        client: newClient,
      };
      oneMessage(connectionInfo, newClient);

      break;
    case "msg":
      transmission (
        {
          type: "msg",
          message: messageServer.message,
          client: client,
        },
        client
      );
      break;
    case "dc":
      transmission (
        {
          type: "dc",
          client: client,
        },
        client,
        { closeServerAfterSend: true }
      );
      break;
    default:
      console.log(messageServer);
      break;
  }
});

// server.on("connect", () => {
//   console.log("connect");
// });

server.on("listening", () => {
  const serverAddress = server.address();

  console.log(
    `O servidor está ouvindo em ${serverAddress.address}:${serverAddress.port} `
  );
});

// server.on("close", () => {
//   rl.close();
// });

server.on("error", (error) => {
  console.log("Server Error");
  console.log(error.message);
  server.close();
});
