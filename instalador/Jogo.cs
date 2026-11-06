// O programa instalado: serve a pasta "jogo" em http://localhost e abre o jogo numa janela própria.
// Só aceita conexões do próprio computador. Quando a janela fecha, o servidor fecha junto.
// Também faz a desinstalação (/desinstalar).
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

static class Jogo {
  const string NOME = "A Terra que Rejeitou";
  const int PORTA = 47615; // porta fixa: o progresso salvo fica preso ao endereço
  static string raiz;

  static readonly Dictionary<string, string> TIPOS = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
    { ".html", "text/html; charset=utf-8" }, { ".js", "text/javascript; charset=utf-8" }, { ".css", "text/css; charset=utf-8" },
    { ".json", "application/json" }, { ".png", "image/png" }, { ".jpg", "image/jpeg" }, { ".svg", "image/svg+xml" }, { ".ico", "image/x-icon" },
    { ".mp4", "video/mp4" }, { ".mp3", "audio/mpeg" }, { ".wav", "audio/wav" }, { ".ogg", "audio/ogg" }, { ".woff2", "font/woff2" }, { ".woff", "font/woff" },
  };

  static string Pasta { get { return AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\'); } }
  static string PastaDados { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), NOME); } }
  static bool Tem(string[] args, string a) { return Array.IndexOf(args, a) >= 0; }
  static string Valor(string[] args, string a) { foreach (string s in args) if (s.StartsWith(a + "=")) return s.Substring(a.Length + 1); return null; }

  [STAThread]
  static void Main(string[] args) {
    Application.EnableVisualStyles();
    if (Tem(args, "/desinstalar")) { Desinstalar(args); return; }
    raiz = Path.Combine(Pasta, "jogo");
    if (!File.Exists(Path.Combine(raiz, "index.html"))) { MessageBox.Show("Os arquivos do jogo não foram encontrados. Instale o jogo de novo.", NOME, MessageBoxButtons.OK, MessageBoxIcon.Error); return; }

    int porta = PORTA; TcpListener ouvinte = null;
    for (; porta < PORTA + 5; porta++) {
      if (JaEhOJogo(porta)) { AbrirJanela("http://localhost:" + porta + "/"); return; } // já está aberto: só mostra outra janela
      try { ouvinte = new TcpListener(IPAddress.Loopback, porta); ouvinte.Start(); break; } catch (SocketException) { ouvinte = null; }
    }
    if (ouvinte == null) { MessageBox.Show("Não foi possível abrir o jogo: as portas " + PORTA + " a " + (PORTA + 4) + " estão ocupadas.", NOME, MessageBoxButtons.OK, MessageBoxIcon.Error); return; }
    Servir(ouvinte);
    try { TcpListener v6 = new TcpListener(IPAddress.IPv6Loopback, porta); v6.Start(); Servir(v6); } catch (SocketException) { }

    if (Tem(args, "/servidor")) { Thread.Sleep(Timeout.Infinite); return; }
    string url = "http://localhost:" + porta + "/";
    Process janela = AbrirJanela(url);
    DateTime t0 = DateTime.Now;
    if (janela != null) { janela.WaitForExit(); if ((DateTime.Now - t0).TotalSeconds > 5) return; }
    // sem Edge ou Chrome (ou se a janela não ficou aberta): usa o navegador padrão e fica um ícone perto do relógio para fechar
    if (janela == null) { try { Process.Start(url); } catch (Exception) { } }
    using (NotifyIcon icone = new NotifyIcon()) {
      icone.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); icone.Text = NOME; icone.Visible = true;
      icone.ContextMenu = new ContextMenu(new[] { new MenuItem("Abrir o jogo", delegate { try { Process.Start(url); } catch (Exception) { } }), new MenuItem("Fechar o jogo", delegate { Application.Exit(); }) });
      icone.ShowBalloonTip(5000, NOME, "O jogo está em " + url + ". Para fechar, use este ícone.", ToolTipIcon.Info);
      Application.Run();
      icone.Visible = false;
    }
  }

  // ---------- janela ----------
  static string AcharNavegador() {
    string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    foreach (string c in new[] { Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"), Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"), Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"), Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"), Path.Combine(local, @"Google\Chrome\Application\chrome.exe") })
      if (File.Exists(c)) return c;
    return null;
  }
  static Process AbrirJanela(string url) {
    string nav = AcharNavegador();
    if (nav == null) return null;
    // perfil próprio: não mistura com o navegador da pessoa e o processo dura enquanto a janela estiver aberta
    string perfil = Path.Combine(PastaDados, "perfil");
    Directory.CreateDirectory(perfil);
    ProcessStartInfo p = new ProcessStartInfo(nav, "--app=\"" + url + "\" --user-data-dir=\"" + perfil + "\" --no-first-run --no-default-browser-check --disable-sync --autoplay-policy=no-user-gesture-required --start-maximized");
    p.UseShellExecute = false;
    try { return Process.Start(p); } catch (Exception) { return null; }
  }

  // ---------- servidor ----------
  static bool JaEhOJogo(int porta) {
    try {
      using (TcpClient c = new TcpClient()) {
        IAsyncResult r = c.BeginConnect(IPAddress.Loopback, porta, null, null);
        if (!r.AsyncWaitHandle.WaitOne(300)) return false;
        c.EndConnect(r);
        c.ReceiveTimeout = 800;
        NetworkStream s = c.GetStream();
        byte[] q = Encoding.ASCII.GetBytes("GET /__terra HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
        s.Write(q, 0, q.Length);
        byte[] b = new byte[512]; int n = s.Read(b, 0, b.Length);
        return Encoding.ASCII.GetString(b, 0, n).Contains("a-terra-que-rejeitou");
      }
    } catch (Exception) { return false; }
  }
  static void Servir(TcpListener ouvinte) {
    Thread t = new Thread(delegate() {
      for (;;) {
        TcpClient c;
        try { c = ouvinte.AcceptTcpClient(); } catch (Exception) { return; }
        ThreadPool.QueueUserWorkItem(delegate { Atender(c); });
      }
    });
    t.IsBackground = true; t.Start();
  }
  static void Atender(TcpClient c) {
    try {
      using (c) {
        c.ReceiveTimeout = 10000; c.SendTimeout = 30000;
        NetworkStream s = c.GetStream();
        string pedido = LerCabecalho(s); if (pedido == null) return;
        string[] linhas = pedido.Split(new[] { "\r\n" }, StringSplitOptions.None), um = linhas[0].Split(' ');
        if (um.Length < 2) return;
        string metodo = um[0], alvo = um[1], faixa = null, host = "";
        for (int i = 1; i < linhas.Length; i++) {
          int d = linhas[i].IndexOf(':'); if (d < 0) continue;
          string k = linhas[i].Substring(0, d).Trim().ToLowerInvariant(), v = linhas[i].Substring(d + 1).Trim();
          if (k == "range") faixa = v; else if (k == "host") host = v;
        }
        // só atende pedidos feitos ao próprio computador
        string nomeHost = host.StartsWith("[") ? host.Substring(0, host.IndexOf(']') + 1) : host.Split(':')[0];
        if (nomeHost != "localhost" && nomeHost != "127.0.0.1" && nomeHost != "[::1]") { Responder(s, "403 Forbidden", "text/plain", "negado", metodo); return; }
        if (metodo != "GET" && metodo != "HEAD") { Responder(s, "405 Method Not Allowed", "text/plain", "metodo", metodo); return; }
        int q = alvo.IndexOf('?'); if (q >= 0) alvo = alvo.Substring(0, q);
        if (alvo == "/__terra") { Responder(s, "200 OK", "text/plain", "a-terra-que-rejeitou", metodo); return; }
        string rel = Uri.UnescapeDataString(alvo).TrimStart('/').Replace('/', '\\');
        if (rel == "") rel = "index.html";
        string cheio = Path.GetFullPath(Path.Combine(raiz, rel));
        if (!cheio.StartsWith(raiz + "\\", StringComparison.OrdinalIgnoreCase) || !File.Exists(cheio)) { Responder(s, "404 Not Found", "text/plain", "nao encontrado", metodo); return; }
        EnviarArquivo(s, cheio, faixa, metodo);
      }
    } catch (Exception) { /* a página fechou no meio do envio: nada a fazer */ }
  }
  static string LerCabecalho(NetworkStream s) {
    StringBuilder b = new StringBuilder(); int x;
    while (b.Length < 16384 && (x = s.ReadByte()) >= 0) {
      b.Append((char)x);
      if (b.Length >= 4 && b[b.Length - 1] == '\n' && b[b.Length - 2] == '\r' && b[b.Length - 3] == '\n' && b[b.Length - 4] == '\r') return b.ToString();
    }
    return null;
  }
  static void Responder(NetworkStream s, string estado, string tipo, string corpo, string metodo) {
    byte[] c = Encoding.UTF8.GetBytes(corpo);
    byte[] h = Encoding.ASCII.GetBytes("HTTP/1.1 " + estado + "\r\nContent-Type: " + tipo + "\r\nContent-Length: " + c.Length + "\r\nConnection: close\r\n\r\n");
    s.Write(h, 0, h.Length);
    if (metodo != "HEAD") s.Write(c, 0, c.Length);
  }
  static void EnviarArquivo(NetworkStream s, string arq, string faixa, string metodo) {
    using (FileStream f = new FileStream(arq, FileMode.Open, FileAccess.Read, FileShare.ReadWrite)) {
      long tam = f.Length, ini = 0, fim = tam - 1; bool parcial = false;
      if (faixa != null && faixa.StartsWith("bytes=") && faixa.IndexOf(',') < 0) {
        string[] p = faixa.Substring(6).Split('-'); long a, b;
        if (p.Length == 2) {
          if (p[0] == "" && long.TryParse(p[1], out b)) { ini = Math.Max(0, tam - b); parcial = true; }
          else if (long.TryParse(p[0], out a)) { ini = a; if (long.TryParse(p[1], out b)) fim = Math.Min(b, tam - 1); parcial = true; }
        }
        if (parcial && ini >= tam) {
          byte[] e = Encoding.ASCII.GetBytes("HTTP/1.1 416 Range Not Satisfiable\r\nContent-Range: bytes */" + tam + "\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
          s.Write(e, 0, e.Length); return;
        }
      }
      string tipo; if (!TIPOS.TryGetValue(Path.GetExtension(arq), out tipo)) tipo = "application/octet-stream";
      long total = fim - ini + 1;
      string h = "HTTP/1.1 " + (parcial ? "206 Partial Content" : "200 OK") + "\r\nContent-Type: " + tipo + "\r\nContent-Length: " + total + "\r\nAccept-Ranges: bytes\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n" + (parcial ? "Content-Range: bytes " + ini + "-" + fim + "/" + tam + "\r\n" : "") + "\r\n";
      byte[] hb = Encoding.ASCII.GetBytes(h);
      s.Write(hb, 0, hb.Length);
      if (metodo == "HEAD") return;
      f.Seek(ini, SeekOrigin.Begin);
      byte[] buf = new byte[65536]; long falta = total; int n;
      while (falta > 0 && (n = f.Read(buf, 0, (int)Math.Min(buf.Length, falta))) > 0) { s.Write(buf, 0, n); falta -= n; }
    }
  }

  // ---------- desinstalar ----------
  static void Desinstalar(string[] args) {
    bool silencioso = Tem(args, "/silencioso");
    string testdir = Valor(args, "/testdir"), de = Valor(args, "/de");
    string exe = Application.ExecutablePath;
    if (de == null) {
      // o programa não consegue apagar a si mesmo enquanto roda: continua a partir de uma cópia temporária
      string copia = Path.Combine(Path.GetTempPath(), "desinstalar-terra-" + Guid.NewGuid().ToString("N") + ".exe");
      File.Copy(exe, copia);
      string extra = (silencioso ? " /silencioso" : "") + (testdir != null ? " \"/testdir=" + testdir + "\"" : "");
      Process.Start(new ProcessStartInfo(copia, "/desinstalar \"/de=" + Pasta + "\"" + extra) { UseShellExecute = false });
      return; // este processo precisa sair para o arquivo poder ser apagado
    }
    Thread.Sleep(400);
    string jogo = Path.Combine(de, "jogo"), prog = Path.Combine(de, "ATerraQueRejeitou.exe");
    try {
      if (!silencioso && MessageBox.Show("Desinstalar " + NOME + "?", NOME, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
      // apaga só o que o instalador colocou; se o jogo estiver aberto, avisa em vez de deixar pela metade
      for (int tent = 0; ; tent++) {
        try {
          if (File.Exists(prog)) File.Delete(prog);
          if (Directory.Exists(jogo)) Directory.Delete(jogo, true);
          break;
        } catch (Exception) {
          if (tent < 8) { Thread.Sleep(500); continue; } // o programa original pode estar terminando de fechar
          if (!silencioso) MessageBox.Show("Feche o jogo e tente desinstalar de novo.", NOME, MessageBoxButtons.OK, MessageBoxIcon.Warning);
          return;
        }
      }
      string area = testdir ?? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), menu = testdir ?? Environment.GetFolderPath(Environment.SpecialFolder.Programs);
      foreach (string l in new[] { Path.Combine(area, NOME + ".lnk"), Path.Combine(menu, NOME + ".lnk") }) if (File.Exists(l)) File.Delete(l);
      if (testdir == null) using (Microsoft.Win32.RegistryKey k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true)) { if (k != null) k.DeleteSubKeyTree("ATerraQueRejeitou", false); }
      if (Directory.Exists(de) && Directory.GetFileSystemEntries(de).Length == 0) Directory.Delete(de);
      if (!silencioso && MessageBox.Show("Jogo removido.\n\nApagar também o seu progresso salvo? Isso não pode ser desfeito.", NOME, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes) {
        try { Directory.Delete(PastaDados, true); } catch (Exception) { }
      }
    } finally {
      // a cópia temporária se apaga depois de fechar
      Process.Start(new ProcessStartInfo("cmd.exe", "/c ping -n 3 127.0.0.1 >nul & del \"" + exe + "\"") { CreateNoWindow = true, UseShellExecute = false });
    }
  }
}
