const inquirer = require('inquirer');
const db = require('./db/connection');
const cTable = require('console.table');


var MainMenu = function () {
    inquirer.prompt(
        {
            type: 'list',
            name: 'mainmenu',
            message: 'What would you like to do',
            choices: ['View All Employees'
                , 'Add Employee'
                , 'Update Employee Role & Manager'
                , 'View All Roles'
                , 'Add Role'
                , 'View All Departments'
                , 'Add Department'
                , 'Quit']
        }
    ).then(({ mainmenu }) => {
        if (mainmenu == 'View All Employees')
            ViewAllEmployees();
        if (mainmenu == 'Add Employee')
            AddEmployee();
        if (mainmenu == 'Update Employee Role & Manager')
            UpdateEmployeeRole();
        if (mainmenu == 'View All Roles')
            ViewAllRoles();
        if (mainmenu == 'Add Role')
            AddRole();
        if (mainmenu == 'View All Departments')
            ViewAllDepartments();
        if (mainmenu == 'Add Department')
            AddDepartment();
        if (mainmenu == 'Quit')
        {
            console.log('Goodbye')
            process.exit(1);
        }
            
    });

};

var ViewAllEmployees = function () {
    const sql = `SELECT e.id, e.first_name,e.last_name, r.title, d.name as department, r.salary, CONCAT(m.first_name,' ',m.last_name) as manager
    FROM employee e
    LEFT JOIN role r on e.role_id = r.id
    LEFT JOIN department d on r.department_id = d.id
    LEFT JOIN employee m on e.manager_id = m.id;`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            MainMenu();
        } else if (rows.length == 0) {
            console.log('No Employees found!');
            MainMenu();
        } else {
            console.log('All Employees');
            console.table(rows);
            MainMenu();
        }
    });

};


var AddEmployee = function () {
    var questions =
        [
            {
                type: 'input',
                name: 'first_name',
                message: 'What is the employee\'s first name?'
            },
            {
                type: 'input',
                name: 'last_name',
                message: 'What is the employee\'s last name?'
            },
        ]

    UpdateRole(null, questions);

};

var UpdateRole = function (e_id, questions) {
    db.query(`SELECT r.id,r.title, d.name as department
    from ROLE r
    LEFT JOIN department d on r.department_id = d.id
    ORDER BY department_id;`, (err, rows) => {
        if (err) {
            console.log(err);
            MainMenu();
        } else if (rows.length == 0) {
            console.log('No Roles found! Please create a role first!');
            MainMenu();
        } else {
            questions.push({
                type: 'list',
                name: 'role',
                message: 'What is the employee\'s role?',
                choices: rows.map((role) => `${role.id}: ${role.department} | ${role.title}`)
            })

            inquirer.prompt(questions)
                .then((data) => {
                    if (!data.first_name && e_id) {
                        db.query(`SELECT first_name, last_name FROM employee where id = ?;`, e_id, (err, rows) => {
                            if (err) {
                                console.log(err);
                                MainMenu();
                            } else if (rows.length == 0) {

                            } else {
                                //set the first name and last name from the e_id
                                data.first_name = rows[0].first_name;
                                data.last_name = rows[0].last_name;
                            }

                        });
                    }

                    UpdateManager(e_id, data); //null for first argument to create
                });

        }
    });
};

var UpdateManager = function (e_id, data) {
    const role_id = data.role.split(': ')[0];
    const roleDetails = data.role.split(': ')[1];
    const department = roleDetails.split(' | ')[0];

    // query only people in that same department
    db.query(`SELECT e.id, e.first_name,e.last_name, r.title, d.name as department, r.salary, CONCAT(m.first_name,' ',m.last_name) as manager
FROM employee e
LEFT JOIN role r on e.role_id = r.id
LEFT JOIN department d on r.department_id = d.id
LEFT JOIN employee m on e.manager_id = m.id
WHERE d.name = ?;`, department, (err, employeerows) => {
        if (err) {
            console.log(err);
            MainMenu();
        } else if (employeerows.length == 0) {
            if (e_id == null)
                InsertEmployee(data.first_name, data.last_name, role_id, null);
            else
                UpdateEmployee(e_id, data.first_name, data.last_name, role_id, null);
        } else {
            var managerQuestions = {
                type: 'list',
                name: 'manager',
                message: 'Who is the employee\'s manager?',
                choices: employeerows.map((employee) => `${employee.id}: ${employee.first_name} ${employee.last_name} `)
            }

            managerQuestions.choices.push('NO MANAGER');

            inquirer.prompt(managerQuestions)
                .then(({ manager }) => {
                    if (manager == 'NO MANAGER') {
                        if (e_id == null)
                            InsertEmployee(data.first_name, data.last_name, role_id, null);
                        else
                            UpdateEmployee(e_id, data.first_name, data.last_name, role_id, null);
                        return;
                    }
                    const manager_id = manager.split(': ')[0];
                    if (e_id == null)
                        InsertEmployee(data.first_name, data.last_name, role_id, manager_id);
                    else
                        UpdateEmployee(e_id, data.first_name, data.last_name, role_id, manager_id);
                })

        }
    });

};

var InsertEmployee = function (first_name, last_name, role_id, manager_id) {
    const sql = `INSERT INTO employee (first_name, last_name, role_id, manager_id)
    VALUES (?,?,?,?)`;
    const params = [first_name, last_name, role_id, manager_id];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
            return;
        }
        console.log(`Added new Employee: ${first_name} ${last_name}`)
        MainMenu();
    });

};

var UpdateEmployee = function (e_id, first_name, last_name, role_id, manager_id) {
    const sql = `UPDATE employee SET role_id = ?, manager_id = ? WHERE id = ?`;
    const params = [role_id, manager_id, e_id];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
            return;
        }
        console.log(`Updated Employee: ${first_name} ${last_name}`)
        MainMenu();
    });

};



var UpdateEmployeeRole = function () {
    // select all employees
    db.query(`SELECT e.id, e.first_name,e.last_name, r.title, d.name as department, r.salary, CONCAT(m.first_name,' ',m.last_name) as manager
                        FROM employee e
                        LEFT JOIN role r on e.role_id = r.id
                        LEFT JOIN department d on r.department_id = d.id
                        LEFT JOIN employee m on e.manager_id = m.id;`, (err, employeerows) => {
        if (err) {
            console.log(err);
            MainMenu();
        } else if (employeerows.length == 0) {
            console.log('No employees found!');
            MainMenu();
        } else {
            inquirer.prompt({
                type: 'list',
                name: 'employee',
                message: 'Which employee do you want to update?',
                choices: employeerows.map((employee) => `${employee.id}: ${employee.first_name} ${employee.last_name} `)
            })
                .then(({ employee }) => {
                    const id = employee.split(': ')[0];
                    const first_name = employee.split(': ')[1].split(' ')[0];
                    const last_name = employee.split(': ')[1].split(' ')[0];

                    var questions = [];
                    UpdateRole(id, questions);
                })


            //MainMenu();


        }
    });

}

var ViewAllRoles = function () {
    const sql = `SELECT r.id, title, d.name as department, salary
    from ROLE r
    LEFT JOIN department d on r.department_id = d.id
    ORDER BY department, salary desc;`;

    db.query(sql, (err, rows) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
        } else if (rows.length == 0) {
            console.log('No roles found!');
            MainMenu();
        } else {
            console.log('All Roles');
            console.table(rows);
            MainMenu();
        }
    });

};

var AddRole = function () {

    db.query(`SELECT * FROM department`, (err, rows) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
            return;
        } else if (rows.length == 0) {
            console.log('Please add a department!');
            MainMenu();
        } else {

            inquirer.prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: 'Enter in the role title'
                },
                {
                    type: 'input',
                    name: 'salary',
                    message: 'Enter in the role salary'
                },
                {
                    type: 'list',
                    name: 'department',
                    message: 'What department does this role belong to?',
                    choices: rows.map((department) => `${department.id}: ${department.name}`)
                }
            ])
                .then((data) => {
                    const department_id = data.department.split(': ')[0];
                    InsertRole(data.title, data.salary, department_id);
                })


        }
    });


}

var InsertRole = function (title, salary, department_id) {
    const sql = `INSERT INTO role (title, salary, department_id)
    VALUES (?,?,?)`;
    const params = [title, salary, department_id];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
            return;
        }
        console.log(`Added new Role: ${title}`)
        MainMenu();
    });

};

var ViewAllDepartments = function () {
    const sql = `SELECT d.id
                        ,d.name
                        ,(SELECT SUM(rr.salary)
                            FROM employee ee
                            LEFT JOIN role rr on ee.role_id = rr.id
                            LEFT JOIN department dd on rr.department_id = dd.id
                            where dd.id = d.id) as Budget
                FROM department d;
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
        } else if (rows.length == 0) {
            console.log('No departments found!');
            MainMenu();
        } else {
            console.log('All Departments');
            console.table(rows);
            MainMenu();
        }
    });

};

var AddDepartment = function () {
    inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Enter in the department name'
    })
        .then(({ name }) => {
            InsertDepartment(name);
        })
};

var InsertDepartment = function (name) {
    const sql = `INSERT INTO department (name)
    VALUES (?)`;
    const params = [name];
    db.query(sql, params, (err, result) => {
        if (err) {
            console.log('ERROR: ' + err.sqlMessage);
            MainMenu();
            return;
        }
        console.log(`Added new Department: ${name}`)
        MainMenu();
    });
};

//Prompt the main menu at the start
console.log('Welcome to the Employee Tracker!');
MainMenu();