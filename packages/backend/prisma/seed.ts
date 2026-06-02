import { PrismaClient, Category, QuestionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@evaltest.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@evaltest.com',
      password: hashedPassword,
    },
  });

  const questions = [
    // ===== REACT + NEXT.JS (4 preguntas) =====
    {
      category: Category.REACT, type: QuestionType.MULTIPLE_CHOICE, order: 1, points: 5,
      title: '¿Qué problema resuelve useEffect?',
      options: [
        { id: 'a', text: 'Manejar eventos del DOM' },
        { id: 'b', text: 'Sincronizar efectos secundarios con el ciclo de vida del componente' },
        { id: 'c', text: 'Crear variables de estado' },
        { id: 'd', text: 'Optimizar renders del componente' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.REACT, type: QuestionType.DEBUGGING, order: 2, points: 15,
      title: '¿Qué bug tiene este componente de búsqueda?',
      snippet: `function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/search?q=' + query)
      .then(res => res.json())
      .then(data => setResults(data));
  }, []);

  return <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>;
}`,
      options: [
        { id: 'a', text: 'No hay bug, funciona correctamente' },
        { id: 'b', text: 'Race condition: si query cambia rápido, respuestas anteriores sobrescriben las nuevas' },
        { id: 'c', text: 'El fetch debería ser async/await' },
        { id: 'd', text: 'Falta un try/catch para errores de red' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.REACT, type: QuestionType.DEBUGGING, order: 3, points: 15,
      title: '¿Qué comportamiento inesperado tiene este contador?',
      snippet: `function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}`,
      options: [
        { id: 'a', text: 'Funciona correctamente' },
        { id: 'b', text: 'count siempre es 1 porque el closure captura count=0 y nunca se actualiza' },
        { id: 'c', text: 'El intervalo se crea múltiples veces' },
        { id: 'd', text: 'setInterval no funciona en React' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.REACT, type: QuestionType.DEBUGGING, order: 4, points: 15,
      title: '¿Qué pasa con el estado de este formulario?',
      snippet: `function Form() {
  const [user, setUser] = useState({ name: '', email: '' });

  function handleChange(field, value) {
    user[field] = value;
    setUser(user);
  }

  return <input value={user.name} onChange={e => handleChange('name', e.target.value)} />;
}`,
      options: [
        { id: 'a', text: 'Funciona correctamente' },
        { id: 'b', text: 'El input no se actualiza porque muta el objeto directamente sin crear uno nuevo' },
        { id: 'c', text: 'Falta declarar useState con el tipo correcto' },
        { id: 'd', text: 'handleChange no existe en el scope' },
      ],
      correctAnswer: 'b',
    },

    // ===== TYPESCRIPT (3 preguntas) =====
    {
      category: Category.TYPESCRIPT, type: QuestionType.MULTIPLE_CHOICE, order: 5, points: 5,
      title: '¿Cuál es la diferencia práctica entre any y unknown?',
      options: [
        { id: 'a', text: 'Son exactamente iguales' },
        { id: 'b', text: 'unknown obliga a hacer type narrowing antes de usar el valor, any no tiene restricciones' },
        { id: 'c', text: 'any es más seguro que unknown' },
        { id: 'd', text: 'unknown no existe en TypeScript' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.TYPESCRIPT, type: QuestionType.DEBUGGING, order: 6, points: 15,
      title: '¿Qué pasa en runtime con este código?',
      snippet: `function process(data: any) {
  return data.toUpperCase();
}
const result = process(null);
console.log(result);`,
      options: [
        { id: 'a', text: 'Compila bien pero crashea en runtime: null no tiene toUpperCase' },
        { id: 'b', text: 'TypeScript lanza error en compilación' },
        { id: 'c', text: 'Devuelve "null" como string' },
        { id: 'd', text: 'Devuelve undefined silenciosamente' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.TYPESCRIPT, type: QuestionType.DEBUGGING, order: 7, points: 15,
      title: '¿Qué bug tiene este uso de genéricos?',
      snippet: `function getFirst<T>(arr: T[]): T {
  return arr[0];
}
const num = getFirst<number>([]);
console.log(num.toFixed(2));`,
      options: [
        { id: 'a', text: 'Funciona correctamente' },
        { id: 'b', text: 'getFirst devuelve undefined si el array está vacío, pero el tipo dice T. toFixed() crashea en runtime' },
        { id: 'c', text: 'La sintaxis getFirst<number> es incorrecta' },
        { id: 'd', text: 'TypeScript infiere el tipo y evita el error' },
      ],
      correctAnswer: 'b',
    },

    // ===== REST API / NEST.JS (3 preguntas) =====
    {
      category: Category.REST_API, type: QuestionType.MULTIPLE_CHOICE, order: 8, points: 5,
      title: 'En Nest.js, ¿qué pasa si olvidas @Injectable() en un servicio?',
      options: [
        { id: 'a', text: 'Funciona igual, es opcional' },
        { id: 'b', text: 'Nest.js lanza un error de inyección de dependencias al iniciar' },
        { id: 'c', text: 'El servicio se crea pero no puede usar otros servicios inyectados' },
        { id: 'd', text: 'Solo falla si el servicio tiene dependencias en el constructor' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.REST_API, type: QuestionType.DEBUGGING, order: 9, points: 15,
      title: '¿Qué problema tiene este controlador?',
      snippet: `@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return user;
  }
}

async findById(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
}`,
      description: '¿Qué pasa si el usuario no existe?',
      options: [
        { id: 'a', text: 'Devuelve null, serializado como 200 con body vacío' },
        { id: 'b', text: 'El endpoint crashea con 500' },
        { id: 'c', text: 'Devuelve 404 automáticamente' },
        { id: 'd', text: 'Prisma lanza un error si findUnique devuelve null' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.REST_API, type: QuestionType.DEBUGGING, order: 10, points: 15,
      title: '¿Qué error de dependencia hay aquí?',
      snippet: `@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}

@Injectable()
export class UsersService {
  constructor(private authService: AuthService) {}
}`,
      options: [
        { id: 'a', text: 'Funciona correctamente' },
        { id: 'b', text: 'Dependencia circular: UsersModule y AuthModule se importan mutuamente' },
        { id: 'c', text: 'AuthService no está exportado' },
        { id: 'd', text: 'No se puede inyectar entre módulos separados' },
      ],
      correctAnswer: 'b',
    },

    // ===== GIT (4 preguntas, solo básico diario) =====
    {
      category: Category.GIT, type: QuestionType.MULTIPLE_CHOICE, order: 11, points: 5,
      title: 'Acabas de hacer git add a un archivo que no querías. ¿Cómo lo sacas del staging?',
      options: [
        { id: 'a', text: 'git reset HEAD <archivo>' },
        { id: 'b', text: 'git remove <archivo>' },
        { id: 'c', text: 'git undo <archivo>' },
        { id: 'd', text: 'git delete <archivo>' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.GIT, type: QuestionType.MULTIPLE_CHOICE, order: 12, points: 5,
      title: 'Trabajas solo en un proyecto. ¿Cuál de estas opciones describe la diferencia entre merge y rebase?',
      options: [
        { id: 'a', text: 'Merge crea un commit adicional, rebase reescribe el historial linealmente' },
        { id: 'b', text: 'Son exactamente iguales' },
        { id: 'c', text: 'Merge es para ramas locales, rebase para remotas' },
        { id: 'd', text: 'Rebase borra la rama original' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.GIT, type: QuestionType.DEBUGGING, order: 13, points: 15,
      title: 'Escenario: Tienes cambios sin commitear y necesitas cambiar de rama urgente',
      snippet: `# Estás en main con cambios importantes sin commitear
# Necesitas ir a feature-branch a revisar un bug urgente
# Sin perder tus cambios actuales`,
      description: '¿Cuál es la secuencia correcta?',
      options: [
        { id: 'a', text: 'git stash && git checkout feature-branch && después git stash pop' },
        { id: 'b', text: 'git commit --force y luego cambiar de rama' },
        { id: 'c', text: 'git checkout feature-branch directamente (Git mueve los cambios solo)' },
        { id: 'd', text: 'git save && git branch feature-branch' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.GIT, type: QuestionType.OPEN, order: 14, points: 20,
      title: 'Eres el único desarrollador. Describe tu rutina diaria con Git: cada cuánto commiteas, cómo nombras ramas, cómo subes los cambios.',
      correctAnswer: 'open',
    },

    // ===== DOCKER (4 preguntas, solo básico diario) =====
    {
      category: Category.DOCKER, type: QuestionType.MULTIPLE_CHOICE, order: 15, points: 5,
      title: '¿Cuál es la diferencia entre un Dockerfile y docker-compose.yml?',
      options: [
        { id: 'a', text: 'Dockerfile define cómo construir una imagen, docker-compose.yml define cómo ejecutar múltiples contenedores juntos' },
        { id: 'b', text: 'Son lo mismo, solo cambia el formato' },
        { id: 'c', text: 'Dockerfile es para producción, compose para desarrollo' },
        { id: 'd', text: 'docker-compose.yml reemplaza al Dockerfile' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.DOCKER, type: QuestionType.MULTIPLE_CHOICE, order: 16, points: 5,
      title: 'Levantaste PostgreSQL con docker run, agregaste datos, y luego eliminaste el contenedor con docker rm. ¿Qué pasa con los datos?',
      options: [
        { id: 'a', text: 'Los datos se pierden porque el contenedor tiene su propio sistema de archivos efímero' },
        { id: 'b', text: 'Los datos se guardan automáticamente en el host' },
        { id: 'c', text: 'Los datos persisten aunque elimines el contenedor' },
        { id: 'd', text: 'PostgreSQL guarda los datos en la nube por defecto' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.DOCKER, type: QuestionType.DEBUGGING, order: 17, points: 15,
      title: 'Debugging: Contenedor falla al iniciar sin mostrar logs',
      snippet: `$ docker run my-app
# No hay output, el contenedor sale inmediatamente
$ docker logs <container-id>
# (vacío)`,
      description: '¿Cuál es el PRIMER comando para entender qué pasó?',
      options: [
        { id: 'a', text: 'docker ps -a para ver el exit code y estado' },
        { id: 'b', text: 'docker rm -f y reintentar' },
        { id: 'c', text: 'Revisar el Dockerfile' },
        { id: 'd', text: 'docker exec -it <container> sh' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.DOCKER, type: QuestionType.OPEN, order: 18, points: 20,
      title: 'Describe paso a paso cómo harías para que tu app Nest.js corra con Docker: desde el Dockerfile hasta que la app responde en localhost.',
      correctAnswer: 'open',
    },

    // ===== SQL (5 preguntas) =====
    {
      category: Category.SQL, type: QuestionType.MULTIPLE_CHOICE, order: 19, points: 5,
      title: '¿Cuál es la diferencia entre DROP TABLE y TRUNCATE TABLE?',
      options: [
        { id: 'a', text: 'DROP elimina la tabla y su estructura, TRUNCATE elimina solo los datos pero la tabla sigue existiendo' },
        { id: 'b', text: 'Son exactamente iguales' },
        { id: 'c', text: 'TRUNCATE elimina la tabla, DROP solo los datos' },
        { id: 'd', text: 'DROP es más rápido que TRUNCATE' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.SQL, type: QuestionType.MULTIPLE_CHOICE, order: 20, points: 5,
      title: 'Tienes una tabla usuarios con columnas: id, name, email, created_at. Quieres agregar una columna "phone". ¿Qué comando usas?',
      options: [
        { id: 'a', text: 'ALTER TABLE usuarios ADD COLUMN phone VARCHAR(20);' },
        { id: 'b', text: 'UPDATE usuarios SET phone = VARCHAR(20);' },
        { id: 'c', text: 'CREATE INDEX phone ON usuarios;' },
        { id: 'd', text: 'MODIFY TABLE usuarios ADD phone;' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.SQL, type: QuestionType.DEBUGGING, order: 21, points: 15,
      title: 'Escenario: Debugging de consulta SQL',
      snippet: `-- Tabla: usuarios (id, nombre)
-- Tabla: pedidos (id, usuario_id, total, fecha)

-- Query: ¿cuánto ha gastado cada usuario en total?
SELECT u.nombre, SUM(p.total) as total_gastado
FROM usuarios u
LEFT JOIN pedidos p ON p.usuario_id = u.id;`,
      description: '¿Qué error tiene esta consulta?',
      options: [
        { id: 'a', text: 'Falta GROUP BY u.id, u.nombre porque SUM es una función de agregación' },
        { id: 'b', text: 'LEFT JOIN debería ser INNER JOIN' },
        { id: 'c', text: 'Falta WHERE p.total IS NOT NULL' },
        { id: 'd', text: 'La sintaxis SUM(p.total) es incorrecta' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.SQL, type: QuestionType.DEBUGGING, order: 22, points: 15,
      title: 'Escenario: Diseño de base de datos',
      snippet: `-- Sistema de tareas: un usuario tiene muchas tareas
-- Cada tarea tiene: título, descripción, estado

-- Opción A:
CREATE TABLE tareas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  titulo TEXT,
  descripcion TEXT,
  estado VARCHAR(20)
);

-- Opción B:
CREATE TABLE tareas (
  id SERIAL PRIMARY KEY,
  titulo TEXT,
  descripcion TEXT,
  estado VARCHAR(20),
  datos_usuario JSONB
);`,
      description: '¿Cuál opción elegirías y por qué?',
      options: [
        { id: 'a', text: 'Opción A: porque normaliza los datos y permite consultar eficientemente por usuario' },
        { id: 'b', text: 'Opción B: porque JSONB es más flexible' },
        { id: 'c', text: 'Ninguna, debería ser una sola tabla usuarios con las tareas como JSON' },
        { id: 'd', text: 'Ambas son equivalentes, da igual cual elegir' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.SQL, type: QuestionType.OPEN, order: 23, points: 20,
      title: 'Te piden diseñar la DB para un sistema de tareas donde un usuario tiene muchas tareas y cada tarea tiene título, descripción y estado. ¿Cómo estructuras las tablas, qué índices pondrías y por qué?',
      correctAnswer: 'open',
    },

    // ===== AI / VIBE CODING (4 preguntas) =====
    {
      category: Category.AI, type: QuestionType.DEBUGGING, order: 24, points: 15,
      title: 'ChatGPT generó este hook. ¿Qué bug tiene?',
      snippet: `// Prompt: "crea un hook useLocalStorage que sincronice con localStorage"
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    return JSON.parse(localStorage.getItem(key)) ?? initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  return [value, setValue];
}`,
      description: 'Funciona al renderizar, pero hay un problema.',
      options: [
        { id: 'a', text: 'No hay bug, funciona perfectamente' },
        { id: 'b', text: 'useEffect no tiene value en dependencias, así que si el estado cambia, no persiste en localStorage' },
        { id: 'c', text: 'JSON.parse puede lanzar error' },
        { id: 'd', text: 'Falta return en useEffect' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.AI, type: QuestionType.DEBUGGING, order: 25, points: 15,
      title: 'Copilot autocompletó este endpoint. ¿Qué falta?',
      snippet: `// Prompt: "crea un endpoint POST /users que reciba name, email y password"
@Post()
async createUser(@Body() body: any) {
  return this.prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
    },
  });
}`,
      description: 'El endpoint funciona, pero hay un problema grave.',
      options: [
        { id: 'a', text: 'No hay problema, funciona correctamente' },
        { id: 'b', text: 'La contraseña se guarda en texto plano, falta hash con bcrypt' },
        { id: 'c', text: 'Falta @UseGuards para proteger el endpoint' },
        { id: 'd', text: 'body: any debería ser un DTO tipado' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.AI, type: QuestionType.OPEN, order: 26, points: 20,
      title: 'Usas AI para generar código constantemente. ¿Cómo estructuras los prompts para que el AI entienda el contexto completo de tu proyecto y no genere snippets aislados?',
      correctAnswer: 'open',
    },
    {
      category: Category.AI, type: QuestionType.OPEN, order: 27, points: 20,
      title: 'El AI te genera código que funciona pero es feo: nombres malos, lógica duplicada, sin manejo de errores. Eres el único dev. ¿Dejas la deuda técnica o refactorizas? ¿Cómo decides?',
      correctAnswer: 'open',
    },

    // ===== DEBUGGING EXTRA (4 preguntas, cross-category) =====
    {
      category: Category.REACT, type: QuestionType.DEBUGGING, order: 28, points: 15,
      title: '¿Qué problema de rendimiento tiene este componente?',
      snippet: `function Parent() {
  const [count, setCount] = useState(0);
  const [items] = useState(['a', 'b', 'c']);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <List items={items} />
    </div>
  );
}
function List({ items }) {
  console.log('List rendered');
  return <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>;
}`,
      options: [
        { id: 'a', text: 'No hay problema de rendimiento' },
        { id: 'b', text: 'Cada click en count re-renderiza List sin necesidad porque no está memoizada con React.memo' },
        { id: 'c', text: 'useState no debe usarse para arrays' },
        { id: 'd', text: 'El console.log causa re-renders infinitos' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.TYPESCRIPT, type: QuestionType.DEBUGGING, order: 29, points: 15,
      title: '¿Qué problema de tipo potencial hay?',
      snippet: `interface User { id: number; name: string; }

async function getUser(id: number): Promise<User> {
  const res = await fetch('/users/' + id);
  const data = await res.json();
  return data;
}

const user = await getUser(1);
console.log(user.name.toUpperCase());`,
      description: 'El código compila pero algo puede fallar en producción.',
      options: [
        { id: 'a', text: 'No hay error, el código es correcto' },
        { id: 'b', text: 'fetch podría devolver HTML si hay 404, res.json() lanzaría excepción inesperada' },
        { id: 'c', text: 'El tipo Promise<User> debería ser Promise<User | null>' },
        { id: 'd', text: 'user.name podría ser undefined aunque la interface diga string' },
      ],
      correctAnswer: 'b',
    },
    {
      category: Category.DOCKER, type: QuestionType.DEBUGGING, order: 30, points: 15,
      title: 'Debugging: App no conecta a la DB en Docker Compose',
      snippet: `services:
  app:
    build: .
    environment:
      DATABASE_URL: "postgresql://admin:secret@localhost:5432/evaltest"
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: evaltest
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret`,
      description: 'La app no conecta a la DB. ¿Cuál es el error?',
      options: [
        { id: 'a', text: 'La app apunta a localhost:5432 en lugar del nombre del servicio "db:5432"' },
        { id: 'b', text: 'Falta definir networks' },
        { id: 'c', text: 'Las contraseñas no coinciden' },
        { id: 'd', text: 'Falta depends_on en app' },
      ],
      correctAnswer: 'a',
    },
    {
      category: Category.SQL, type: QuestionType.DEBUGGING, order: 31, points: 15,
      title: 'Debugging: N+1 query problem en Prisma',
      snippet: `const users = await prisma.user.findMany();

for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
  console.log(user.name, posts.length);
}`,
      options: [
        { id: 'a', text: 'No hay problema de rendimiento' },
        { id: 'b', text: 'Hace 1 query + N queries = N+1. Debe usar include: { posts: true }' },
        { id: 'c', text: 'El console.log dentro del loop bloquea el event loop' },
        { id: 'd', text: 'findMany no existe en Prisma' },
      ],
      correctAnswer: 'b',
    },
  ];

  await prisma.answer.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.question.deleteMany();

  for (const q of questions) {
    await prisma.question.create({ data: q as any });
  }

  const count = await prisma.question.count();
  const mc = questions.filter(q => q.type === 'MULTIPLE_CHOICE').length;
  const dbg = questions.filter(q => q.type === 'DEBUGGING').length;
  const opn = questions.filter(q => q.type === 'OPEN').length;

  console.log(`Seed completado:`);
  console.log(`  Admin: ${process.env.ADMIN_EMAIL || 'admin@evaltest.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`  Preguntas: ${count} (MC: ${mc}, Debugging: ${dbg}, Abiertas: ${opn})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
