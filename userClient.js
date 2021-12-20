const readline = require("readline");
const dgram = require("dgram");

const server = {
  host: process.argv[2],
  port: 3000,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function escrever(message) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  console.log(message);
}

const userClient = dgram.createSocket("udp4");

let nome;
rl.question("Informe seu nome: ", (answer) => {
  nome = answer;
  conectarServidor();
});

function enviarMsg(message, options) {
  const buffer = Buffer.from(JSON.stringify(message));

  userClient.send(buffer, 0, buffer.length, server.port, server.host, () => {
    if (options?.closeServerAfterenviarMsg) {
      userClient.close();
      escrever("Conexão encerrada com sucesso!");
    }
  });
}

function conectarServidor() {
  userClient.bind();

  userClient.on("listening", () => {
    const conectar = {
      type: "conexao",
      author: nome,
    };

    enviarMsg(conectar);
  });

  userClient.on("message", (message) => {
    const mensagemUsuario = JSON.parse(String(message));
    console.log(mensagemUsuario)

    switch (mensagemUsuario.type) {
      case "conexaoFeita":
        console.log(
          `Você foi conectado com o IP: ${mensagemUsuario.client.address}`
        );
        console.log(`(Digite "exit" para encerrar) \n`);
        //rl.setPrompt(`${mensagemUsuario.client.address} | ${nome}: `);
        mensagemUsuario.users.map((e, i) => {
          if (mensagemUsuario.client.author !== e.author)
            console.log(`${i + 1}-${e.author}`);
        });
        if (!mensagemUsuario.client.userConnect) {
          rl.setPrompt(`Digite um dos nome acima para iniciar um chat: `);
          iniciar(mensagemUsuario.client);
        } else {
          rl.setPrompt(`${mensagemUsuario.client.address} | ${nome}: `);
          iniciar(mensagemUsuario.client);
        }
        break;
      case "novaConexao":
        escrever(
          `O usuario ${mensagemUsuario.client.author} se conectou ao servidor \n`
        );
        mensagemUsuario.users.map((e, i) => {
          if (mensagemUsuario.client.author !== e.author)
            console.log(`${i + 1}-${e.author}`);
        });
        rl.prompt();
        break;
      case "msg":
        escrever(
          `Mensagem recebida de ${mensagemUsuario.client.address} | ${mensagemUsuario.client.author}: ${mensagemUsuario.message}`
        );
        rl.prompt();
        break;
      case "dc":
        userClient.close();
        escrever(
          `A conexão foi encerrada por ${mensagemUsuario.client.author}!`
        );
        break;
      default:
        console.log(mensagemUsuario);
        break;
    }
  });

  userClient.on("error", (err) => {
    console.log(err);
  });

  userClient.on("close", function () {
    rl.close();
    console.log('Pressione "Ctrl + C" para encerrar.');
  });
}

function iniciar(clientUser) {
  rl.prompt();

  rl.on("line", (input) => {
    rl.prompt();
    if (input.trim().length == 0) {
      return rl.write("Mensagem Inválida");
    }

    if (!clientUser.userConnect) {
      const conectionUser = {
        type: "conexaoPrivada",
        user: clientUser,
        name: input,
      };

      enviarMsg(conectionUser);
    } else {
      switch (input) {
        case "exit":
          const dcMsg = {
            type: "dc",
          };
          enviarMsg(dcMsg, { closeServerAfterenviarMsg: true });
          break;
        default:
          const message = {
            type: "msg",
            message: input,
          };
          enviarMsg(message);
          break;
      }
    }
  });
}
