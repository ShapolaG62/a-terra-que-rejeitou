// O instalador: uma tela em português que pergunta a pasta e o atalho, e copia o jogo. Não precisa de administrador.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;

static class Instalador {
  public const string NOME = "A Terra que Rejeitou", EXE = "ATerraQueRejeitou.exe";
  public static string PastaPadrao { get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", NOME); } }
  static string Valor(string[] args, string a) { foreach (string s in args) if (s.StartsWith(a + "=")) return s.Substring(a.Length + 1); return null; }

  [STAThread]
  static int Main(string[] args) {
    if (Array.IndexOf(args, "/silencioso") >= 0) {
      try { Instalar(Valor(args, "/pasta") ?? PastaPadrao, Valor(args, "/atalho") != "nao", Valor(args, "/testdir"), null); return 0; }
      catch (Exception e) { Console.Error.WriteLine(e); return 1; }
    }
    Application.EnableVisualStyles();
    Application.SetCompatibleTextRenderingDefault(false);
    Application.Run(new Tela());
    return 0;
  }

  static Stream Recurso(string nome) { return Assembly.GetExecutingAssembly().GetManifestResourceStream(nome); }
  public static Image Emblema() { return Image.FromStream(Recurso("emblema.png")); }

  public static void Instalar(string pasta, bool atalho, string testdir, Action<int> progresso) {
    Directory.CreateDirectory(pasta);
    string jogo = Path.Combine(pasta, "jogo"), exe = Path.Combine(pasta, EXE);
    // uma instalação anterior é trocada inteira; se o jogo estiver aberto, isto falha e a tela avisa
    using (Stream e = Recurso("jogo.exe")) using (FileStream f = new FileStream(exe, FileMode.Create, FileAccess.Write)) e.CopyTo(f);
    if (Directory.Exists(jogo)) Directory.Delete(jogo, true);
    using (Stream z = Recurso("jogo.zip")) using (ZipArchive a = new ZipArchive(z, ZipArchiveMode.Read)) {
      long total = 0, feito = 0;
      foreach (ZipArchiveEntry en in a.Entries) total += en.Length;
      string raiz = Path.GetFullPath(jogo) + "\\";
      foreach (ZipArchiveEntry en in a.Entries) {
        string dest = Path.GetFullPath(Path.Combine(jogo, en.FullName.Replace('/', '\\')));
        if (!dest.StartsWith(raiz, StringComparison.OrdinalIgnoreCase)) continue;
        if (en.Name == "") { Directory.CreateDirectory(dest); continue; }
        Directory.CreateDirectory(Path.GetDirectoryName(dest));
        en.ExtractToFile(dest, true);
        feito += en.Length;
        if (progresso != null) progresso((int)(feito * 100 / Math.Max(1, total)));
      }
    }
    string menu = testdir ?? Environment.GetFolderPath(Environment.SpecialFolder.Programs), area = testdir ?? Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
    CriarAtalho(Path.Combine(menu, NOME + ".lnk"), exe, pasta);
    string naArea = Path.Combine(area, NOME + ".lnk");
    if (atalho) CriarAtalho(naArea, exe, pasta);
    else if (testdir == null && File.Exists(naArea)) File.Delete(naArea);
    if (testdir == null) RegistrarDesinstalacao(pasta, exe);
  }
  static void CriarAtalho(string lnk, string exe, string pasta) {
    Type t = Type.GetTypeFromProgID("WScript.Shell");
    dynamic sh = Activator.CreateInstance(t);
    dynamic a = sh.CreateShortcut(lnk);
    a.TargetPath = exe; a.WorkingDirectory = pasta; a.IconLocation = exe + ",0"; a.Description = NOME;
    a.Save();
  }
  static void RegistrarDesinstalacao(string pasta, string exe) {
    // aparece em Configurações > Aplicativos, como qualquer programa
    using (Microsoft.Win32.RegistryKey k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\ATerraQueRejeitou")) {
      k.SetValue("DisplayName", NOME); k.SetValue("DisplayIcon", exe); k.SetValue("DisplayVersion", "1.0");
      k.SetValue("InstallLocation", pasta); k.SetValue("UninstallString", "\"" + exe + "\" /desinstalar");
      k.SetValue("NoModify", 1); k.SetValue("NoRepair", 1);
    }
  }
}

// A tela, nas cores do jogo.
class Tela : Form {
  static readonly Color FUNDO = Color.FromArgb(20, 16, 15), CAIXA = Color.FromArgb(13, 10, 9), BORDA = Color.FromArgb(124, 90, 44), OURO = Color.FromArgb(242, 193, 78), CREME = Color.FromArgb(239, 224, 192), APAGADO = Color.FromArgb(170, 155, 130);
  TextBox pasta; RadioButton sim, nao; Button instalar, cancelar, alterar; ProgressBar barra; Label estado, pergunta; CheckBox abrir; bool pronto;

  Label Rotulo(string t, int x, int y, int w, int h, Color c, float tam = 10f, FontStyle st = FontStyle.Regular) {
    Label l = new Label(); l.Text = t; l.Location = new Point(x, y); l.Size = new Size(w, h); l.ForeColor = c; l.BackColor = Color.Transparent; l.Font = new Font("Segoe UI", tam, st); Controls.Add(l); return l;
  }
  Button Botao(string t, int x, int y, int w, bool principal) {
    Button b = new Button(); b.Text = t; b.Location = new Point(x, y); b.Size = new Size(w, 34); b.FlatStyle = FlatStyle.Flat; b.FlatAppearance.BorderColor = principal ? OURO : BORDA; b.FlatAppearance.BorderSize = principal ? 2 : 1;
    b.BackColor = principal ? Color.FromArgb(51, 38, 30) : CAIXA; b.ForeColor = CREME; b.Font = new Font("Segoe UI", 10f, principal ? FontStyle.Bold : FontStyle.Regular); b.UseVisualStyleBackColor = false; b.Cursor = Cursors.Hand; Controls.Add(b); return b;
  }
  RadioButton Radio(string t, int x, int y, bool marcado) {
    RadioButton r = new RadioButton(); r.Text = t; r.Location = new Point(x, y); r.AutoSize = true; r.Checked = marcado; r.ForeColor = CREME; r.BackColor = Color.Transparent; r.Font = new Font("Segoe UI", 10f); r.Cursor = Cursors.Hand; Controls.Add(r); return r;
  }

  public Tela() {
    Text = "Instalar " + Instalador.NOME;
    ClientSize = new Size(540, 410); FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false; StartPosition = FormStartPosition.CenterScreen; BackColor = FUNDO; AutoScaleMode = AutoScaleMode.Dpi; AutoScaleDimensions = new SizeF(96f, 96f);
    try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch (Exception) { }
    PictureBox fig = new PictureBox(); fig.Image = Instalador.Emblema(); fig.SizeMode = PictureBoxSizeMode.Zoom; fig.Location = new Point(24, 22); fig.Size = new Size(84, 84); fig.BackColor = Color.Transparent; Controls.Add(fig);
    Rotulo(Instalador.NOME, 122, 28, 395, 36, OURO, 17f, FontStyle.Bold);
    Rotulo("O jogo fica no seu computador e abre", 124, 64, 395, 22, CREME);
    Rotulo("numa janela própria. Não precisa de mais nada.", 124, 84, 395, 22, CREME);

    Rotulo("Onde instalar", 24, 124, 300, 22, OURO, 10f, FontStyle.Bold);
    pasta = new TextBox(); pasta.Text = Instalador.PastaPadrao; pasta.Location = new Point(24, 148); pasta.Size = new Size(392, 26); pasta.BackColor = CAIXA; pasta.ForeColor = CREME; pasta.BorderStyle = BorderStyle.FixedSingle; pasta.Font = new Font("Segoe UI", 9.5f); Controls.Add(pasta);
    alterar = Botao("Alterar…", 424, 145, 92, false);
    alterar.Click += delegate {
      using (FolderBrowserDialog d = new FolderBrowserDialog()) {
        d.Description = "Escolha onde instalar o jogo"; d.SelectedPath = Directory.Exists(pasta.Text) ? pasta.Text : "";
        if (d.ShowDialog(this) == DialogResult.OK) pasta.Text = d.SelectedPath.TrimEnd('\\').EndsWith(Instalador.NOME, StringComparison.OrdinalIgnoreCase) ? d.SelectedPath : Path.Combine(d.SelectedPath, Instalador.NOME);
      }
    };

    pergunta = Rotulo("Quer criar um atalho na área de trabalho?", 24, 196, 490, 24, OURO, 10f, FontStyle.Bold);
    sim = Radio("Sim, criar o atalho", 26, 224, true);
    nao = Radio("Não, obrigado", 26, 252, false);

    barra = new ProgressBar(); barra.Location = new Point(24, 296); barra.Size = new Size(492, 14); barra.Visible = false; barra.Maximum = 100; Controls.Add(barra);
    estado = Rotulo("", 24, 326, 492, 24, APAGADO, 9.5f);
    abrir = new CheckBox(); abrir.Text = "Abrir o jogo agora"; abrir.Location = new Point(26, 296); abrir.AutoSize = true; abrir.Checked = true; abrir.ForeColor = CREME; abrir.BackColor = Color.Transparent; abrir.Font = new Font("Segoe UI", 10f); abrir.Visible = false; Controls.Add(abrir);

    cancelar = Botao("Cancelar", 300, 358, 100, false);
    instalar = Botao("Instalar", 408, 358, 108, true);
    cancelar.Click += delegate { Close(); };
    instalar.Click += delegate { if (pronto) Concluir(); else Comecar(); };
    AcceptButton = instalar; CancelButton = cancelar; ActiveControl = instalar;
  }

  void Comecar() {
    string destino = pasta.Text.Trim(), erroPasta = null;
    try { if (destino == "" || !Path.IsPathRooted(destino)) erroPasta = "Escolha uma pasta válida."; else destino = Path.GetFullPath(destino); }
    catch (Exception) { erroPasta = "Escolha uma pasta válida."; }
    if (erroPasta != null) { estado.Text = erroPasta; estado.ForeColor = Color.FromArgb(255, 138, 90); return; }
    bool atalho = sim.Checked;
    instalar.Enabled = cancelar.Enabled = alterar.Enabled = sim.Enabled = nao.Enabled = pasta.Enabled = false;
    barra.Visible = true; estado.ForeColor = APAGADO; estado.Text = "Copiando os arquivos do jogo…";
    Thread t = new Thread(delegate() {
      string erro = null;
      try { Instalador.Instalar(destino, atalho, null, delegate(int p) { BeginInvoke((Action)delegate { barra.Value = p; }); }); }
      catch (IOException) { erro = "Não deu para trocar os arquivos. Se o jogo estiver aberto, feche-o e tente de novo."; }
      catch (UnauthorizedAccessException) { erro = "Sem permissão para instalar nessa pasta. Escolha outra ou feche o jogo, se estiver aberto."; }
      catch (Exception e) { erro = "A instalação falhou: " + e.Message; }
      BeginInvoke((Action)delegate { Terminou(destino, atalho, erro); });
    });
    t.IsBackground = true; t.Start();
  }
  string instalado;
  void Terminou(string destino, bool atalho, string erro) {
    barra.Visible = false;
    if (erro != null) {
      estado.Text = erro; estado.ForeColor = Color.FromArgb(255, 138, 90);
      instalar.Enabled = cancelar.Enabled = alterar.Enabled = sim.Enabled = nao.Enabled = pasta.Enabled = true;
      return;
    }
    instalado = Path.Combine(destino, Instalador.EXE); pronto = true;
    estado.ForeColor = OURO;
    estado.Text = atalho ? "Pronto! O atalho está na área de trabalho e no menu Iniciar." : "Pronto! O jogo está no menu Iniciar.";
    abrir.Visible = true; cancelar.Visible = false;
    instalar.Text = "Concluir"; instalar.Enabled = true; instalar.Focus();
  }
  void Concluir() {
    if (abrir.Checked) { try { Process.Start(new ProcessStartInfo(instalado) { WorkingDirectory = Path.GetDirectoryName(instalado) }); } catch (Exception) { } }
    Close();
  }
}
