import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";

const client = await new Client().connect({
    hostname: '172.17.0.2',
    username: 'root',
    db: 'todos',
    password: 'changePassword',
})

await client.execute(`CREATE DATABASE IF NOT EXISTS todos`);
await client.execute(`USE todos`);
/* 
await client.execute(`DROP TABLE IF EXISTS users`)
await client.execute(`
    CREATE TABLE users(
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(100) NOT NULL,
        status varchar(100) NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
 */
try {
    await client.execute(`
    CREATE TABLE users(
        id int(11) NOT NULL AUTO_INCREMENT,
        title varchar(100) NOT NULL,
        status varchar(100) NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`);
} catch (err) {
    console.log("Table already exist")
}

// Add routing

// Example of insert values into our database
/* let result = await client.execute(`
        INSERT INTO users(title, status) values(?)
`, [
    "Learn Rust",
    "done",
]) */

/* let result = await client.execute(`INSERT INTO users values(?)`, [
    "manyuanrong",
    "todo",
]);
console.log(result); */

/* let result = await client.execute(`INSERT INTO users(title, status) values(?,?)`, ["Learn Rust", "todo"])
console.log(result);
 */

const queryExample = async (id: number) => {
    const queryWithParams = await client.query("select ??, title, status from ?? where id = ?", ["id", "users", id]);
    return queryWithParams;
}

const queryStatus = async (status: String) => {
    const queryWithParams = await client.query("select id, title, status from ?? where status = ?", ["users", status]);
    return queryWithParams;
}

const createItem = async (title: String, status: String) => {

    const result = await client.execute(`INSERT INTO users(title, status) values(?, ?)`, [title, status]);
    return result.lastInsertId;
}

const updateItem = async(id: number, status: String) => {
    const result = await client.execute(`update users set ?? = ? where id = ?`, ["status", status, id])
    console.log(result);
}

const router = new Router();

router.get('/', (ctx) => {
    ctx.response.body = "Welcome to this simple todo App build with deno";
})

router.get('/todos', async (ctx) => {
    const users = await client.query(`select * from users`);
    ctx.response.body = users;
})

router.get('/todo/:id', async (ctx) => {
    if (ctx?.params?.id) {
        const query = queryExample(parseInt(ctx?.params?.id));
        ctx.response.body = await query
    }
})

router.get('/todolist/:status', async (ctx) => {
    if (ctx?.params?.status) {
        console.log(ctx.params.status);
        const query = queryStatus(ctx.params.status);
        ctx.response.body = await query
    }
})

router.post('/todo', async(ctx) => {
    try {
        const body = await ctx.request.body();
        if (body.type !== 'json') throw new Error('Invalid Body');
        console.log(body);
        const response = await createItem(body.value.title, body.value.status);
        const dtoBuild = {
            "id": response,
            "title": body.value.title,
            "status": body.value.status,
        }
        ctx.response.status = 200;
        ctx.response.body = dtoBuild;
    } catch (err) {
        ctx.response.status = 422;
        ctx.response.body = {
            message: err.message
        }
    }
})

router.put('/update/:id', async(ctx) => {
    try {
        const body = await ctx.request.body();
        if (body.type !== 'json') throw new Error('Invalid Body');
        const { status } = body.value;
        if (ctx?.params?.id) {
            const update = updateItem(parseInt(ctx.params.id), status)
            console.log(update)
        }
    } catch (err) {
        ctx.response.status = 422;
        ctx.response.body = {
            message: err.message
        }
    }
})


const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening on port 8000");
await app.listen({ port: 8000})