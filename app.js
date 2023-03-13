const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
var isValid = require("date-fns/isValid");

const app = express(); // instanceof express.
app.use(express.json()); // in-built middleware functionality.

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(59111, () => {
      console.log("Server Running at http://localhost:59111/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// API-1 Returns a list of all todos whose status is 'TO DO'

const convertTodoStatusInCamelCase = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

const functionStatusCheck = (object) => {
  return object.status !== undefined;
};
const functionPriorityCheck = (object) => {
  return object.priority !== undefined;
};
const functionPriorityAndStatusCheck = (object) => {
  return object.priority !== undefined && object.status !== undefined;
};
const functionCategoryAndStatusCheck = (object) => {
  return object.category !== undefined && object.status !== undefined;
};
const functionCategoryCheck = (object) => {
  return object.category !== undefined;
};
const functionCategoryAndPriorityCheck = (object) => {
  return object.category !== undefined && object.priority !== undefined;
};
app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  let todoStatusQuery;
  let todoStatusResponse;
  let arrayLength;
  switch (true) {
    case functionPriorityAndStatusCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE priority='${priority}' AND status='${status}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      }
      break;
    case functionCategoryAndStatusCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE category='${category}' AND status='${status}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      }
      break;
    case functionCategoryAndPriorityCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      }
      break;
    case functionStatusCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE status='${status}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case functionPriorityCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case functionCategoryCheck(request.query):
      todoStatusQuery = `SELECT * FROM todo WHERE category='${category}';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      todoStatusQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      todoStatusResponse = await db.all(todoStatusQuery);
      arrayLength = todoStatusResponse.length;
      if (arrayLength !== 0) {
        response.send(
          todoStatusResponse.map((eachTodo) =>
            convertTodoStatusInCamelCase(eachTodo)
          )
        );
      }
  }
});

// API-2 Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params; // path parameter;
  const todoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoIdResponse = await db.get(todoIdQuery);
  const singleTodoObject = {
    id: todoIdResponse.id,
    todo: todoIdResponse.todo,
    priority: todoIdResponse.priority,
    status: todoIdResponse.status,
    category: todoIdResponse.category,
    dueDate: todoIdResponse.due_date,
  };
  response.send(singleTodoObject);
});

// API-3 Returns a list of all todos with a specific due date in the query parameter `/agenda/?date=2021-12-12`
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateFormat = format(new Date(date), "yyyy-MM-dd");
  let dateQuery;
  let dateResponse;
  let lengthOfArray;
  dateQuery = `SELECT * FROM todo WHERE due_date='${dateFormat}';`;
  dateResponse = await db.all(dateQuery);
  lengthOfArray = dateResponse.length;
  if (lengthOfArray !== 0) {
    response.send(
      dateResponse.map((eachTodo) => convertTodoStatusInCamelCase(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API-4 Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const dateFormat = format(new Date(dueDate), "yyyy-MM-dd");

  if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    status !== "DONE" &&
    status !== "IN PROGRESS" &&
    status !== "TO DO"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (dateFormat !== dueDate) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const createTodoQuery = `INSERT INTO 
       todo (id,todo,priority,status,category,due_date)
       VALUES
    (${id},'${todo}','${priority}','${status}','${category}','${dateFormat}');`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

// API-5 Updates the details of a specific todo based on the todo ID

const functionUpdateStatus = (object) => {
  if (object.status !== undefined) {
    return true;
  }
};
const functionUpdatePriority = (object) => {
  return object.priority !== undefined;
};
const functionUpdateTodo = (object) => {
  return object.todo !== undefined;
};
const functionUpdateCategory = (object) => {
  return object.category !== undefined;
};
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateTodoQuery;

  switch (true) {
    case functionUpdateStatus(request.body, response):
      if (status !== "DONE" && status !== "IN PROGRESS" && status !== "TO DO") {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        updateTodoQuery = `UPDATE todo SET 
            status='${status}'
            WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      }
      break;

    case functionUpdatePriority(request.body):
      if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        updateTodoQuery = `UPDATE todo SET 
          priority='${priority}'
          WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      }
      break;

    case functionUpdateTodo(request.body):
      updateTodoQuery = `UPDATE todo SET 
            todo='${todo}'
            WHERE id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    case functionUpdateCategory(request.body):
      if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        updateTodoQuery = `UPDATE todo SET 
          category='${category}'
          WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      }
      break;
    default:
      const dateFormat = format(new Date(dueDate), "yyyy-MM-dd");
      if (dateFormat !== dueDate) {
        response.status(400);
        response.send("Invalid Due Date");
      } else {
        updateTodoQuery = `UPDATE todo SET 
          due_date='${dateFormat}'
           WHERE id=${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      }
  }
});

// API-6 Deletes a todo from the todo table based on the todo ID

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params; // path parameter;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
