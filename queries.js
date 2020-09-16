const config = require('config');
const multer = require('multer')
var jwt = require('jsonwebtoken');

const Pool = require('pg').Pool

const pool = new Pool({
    user: config.get('db.user'),
    host: config.get('db.host'),
    database: config.get('db.database'),
    password: config.get('db.password'),
    port: config.get('db.port'),
    ssl: {
        rejectUnauthorized: false
    }
})

const getCoachs = (request, response) => {
    pool.query('SELECT * FROM coach ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getUsers = (request, response) => {
    pool.query('SELECT * FROM usuario ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getUser = (request, response, id) => {
    pool.query('SELECT * FROM usuario WHERE id = ' + request.params.id + ' ORDER BY id ASC', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}

const getTraining = (request, response) => {
    pool.query(`SELECT treino.id, treino.idplanilha, treino.idplanilhaatleta, treino.data, treino.observacao, exerciciostreino.* , treinoatleta.comentario, treinoatleta.done
    FROM treino 
    inner join exerciciostreino on treino.id = exerciciostreino.idtreino
    left join treinoatleta on treino.id = treinoatleta.idtreino and treinoatleta.idatleta =  ${request.params.idAtleta}
    WHERE
    treino.idplanilha = (select idplanilha from planilhaatleta where idAtleta = ${request.params.idAtleta}) AND
    data = '${request.params.selectedDate}'`, (error, results) => {
        if (error) {
            throw error
        }

        var groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        var groupedByParte = groupBy(results.rows, 'partetreino')
        var list = Object.entries(groupedByParte).map((t) => t)

        response.status(200).json(list)
    })
}

const getTreinoPlanilha = (request, response) => {
    pool.query(`SELECT * 
    FROM treino inner join exerciciostreino on treino.id = exerciciostreino.idtreino
    WHERE
    idplanilha = ${request.params.idPlanilha} AND
    data = '${request.params.selectedDate}'`, (error, results) => {
        if (error) {
            throw error
        }

        var groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        var groupedByParte = groupBy(results.rows, 'partetreino')
        var list = Object.entries(groupedByParte).map((t) => t)

        response.status(200).json(list)
    })
}


const getTrainingDates = (request, response) => {
    pool.query(`select t.data, u.nome, pa.id as idplanilhaatleta, pa.idplanilha
    from treino t inner join planilhaatleta pa on t.idplanilha = pa.idplanilha
                  inner join usuario u on u.id = pa.idatleta
    where pa.idatleta = ${request.params.idAtleta}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}



const getPR = (request, response) => {
    pool.query(`select mp.id, nome, max(resultado) as resultado
    from movimentospadrao as mp 
    left join personalrecord as pr 
    on pr.idexercicio = mp.id and pr.idatleta = ${request.params.idAtleta}
    group by mp.id
    order by nome`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}


const getPRHistory = (request, response) => {
    pool.query(`select id, data, resultado 
    from personalrecord where idatleta = ${request.params.idAtleta} and idexercicio = ${request.params.idMovimento}
    order by data desc`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}

const getAtleta = (request, response) => {
    pool.query(`SELECT nome, email, endereco, bairro, estado, cep 
    FROM usuario 
    WHERE
    id = ${request.params.idAtleta}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const getAtletas = (request, response) => {
    pool.query(`select 
    u.id, u.nome as nome, u.email, p.nome as planilha,  pa.situacaopagamento as status, pa.idplanilha
from usuario u inner join planilhaatleta pa on pa.idatleta = u.id
               inner join planilhas p on p.id = pa.idplanilha
where u.idcoach = ${request.params.idCoach} order by u.id`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}


const updateAtleta = (request, response) => {
    pool.query(`update usuario set nome = '${request.body.Nome}', 
                                   email = '${request.body.Email}', 
                                   senha = '${request.body.Senha}', 
                                   endereco = '${request.body.Endereco}', 
                                   bairro = '${request.body.Bairro}', 
                                   estado = '${request.body.Estado}', 
                                   cep = '${request.body.Cep}'
    WHERE id = ${request.params.idAtleta}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const updateCoach = (request, response) => {

    pool.query(`update coach set nomecoach = '${request.body.nomecoach}', 
                                   logo = '${request.body.logo}', 
                                   nomeprograma = '${request.body.nomeprograma}', 
                                   descricaotrabalho = '${request.body.descricaotrabalho}'
    WHERE id = ${request.params.idCoach}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const insertPRHistory = (request, response) => {
    pool.query(`insert into personalrecord (id, idatleta, idexercicio, data, resultado) 
    values (default,
            ${request.params.idAtleta},
            ${request.params.idMovimento},
            '${request.body.DataPR}',
            ${request.body.ResultadoPR})`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}

const insertTreinoDone = (request, response) => {
    pool.query(`insert into treinoatleta (id, idatleta, idtreino, idplanilha, done, comentario)
    values (default, ${request.params.idAtleta}, ${request.body.idTreino}, ${request.body.idPlanilha}, true, '${request.body.comentario}')`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}

const deletePRHistory = (request, response) => {
    pool.query(`delete from personalrecord where idatleta = ${request.params.idAtleta} and id = ${request.params.idMovimento}`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}


const getPerfilTreinador = (request, response) => {
    pool.query(`SELECT *
    FROM coach 
    WHERE
    id = ${request.params.idCoach}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}


const getPlanilhas = (request, response) => {
    pool.query(`SELECT *
    FROM planilhas 
    WHERE
    idcoach = ${request.params.idCoach}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}

const getPlanilha = (request, response) => {
    pool.query(`SELECT *
    FROM planilhas 
    WHERE
    id = ${request.params.idPlanilha}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const updatePlanilhaAtleta = (request, response) => {
    pool.query(`update planilhaatleta set idplanilha = ${request.params.idPlanilha} 
                where idatleta = ${request.params.idAtleta}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const getPlanilhasAtletas = (request, response) => {
    pool.query(`(
        select pa.idatleta, pa.idplanilha, pa.id as idplanilhaatleta, u.nome, p.nome as planilha, p.tipo
        from planilhaatleta pa inner join planilhas p on p.id = pa.idplanilha
                            inner join usuario u on u.id = pa.idatleta
        where pa.idCoach = ${request.params.idCoach} and tipo = 'personalizada'
    )
    union
    (
        select 0 as idatleta, id, 0, '', nome , tipo 
        from planilhas
        where idcoach = ${request.params.idCoach} and tipo = 'generica'
    )`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows)
    })
}


const insertPlanilha = (request, response) => {
    pool.query(`insert into planilhas (id, idcoach, nome, tipo, descricao, valor) 
    values (default,
            ${request.params.idCoach},
            '${request.body.nome}',
            '${request.body.tipo}',
            '${request.body.descricao}',
            ${request.body.valor})`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}

const updatePlanilha = (request, response) => {

    pool.query(`update planilhas set nome = '${request.body.nome}', 
                                    tipo = '${request.body.tipo}', 
                                    descricao = '${request.body.descricao}', 
                                    valor = ${request.body.valor}
                                WHERE id = ${request.params.idPlanilha}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const updateStatusAtleta = (request, response) => {

    pool.query(`update planilhaatleta set situacaopagamento = '${request.body.status}' where idatleta = ${request.params.idAtleta}`, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows[0])
    })
}

const deletePlanilha = (request, response) => {
    pool.query(`delete from planilhas where idcoach = ${request.params.idCoach} and id = ${request.params.idPlanilha}`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0])
    })
}

const getProgramTrainingDates = (request, response) => {
    pool.query(`select p.nome, t.data
    from treino t inner join planilhas p on t.idplanilha = p.id
    where idplanilha = ${request.params.idProgram}`, (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const insertTreino = (request, response) => {

    sqlPlanilhaAtleta = '';
    idPlanilhaAtleta = null;
    let idTreino = 0;

    if (request.params.idPlanilhaAtleta > 0) {
        sqlPlanilhaAtleta = `idplanilhaatleta = ${request.params.idPlanilhaAtleta}`
        idPlanilhaAtleta = request.params.idPlanilhaAtleta;
    }
    else {
        sqlPlanilhaAtleta = `idplanilhaatleta is null`
    }

    pool.query(`select id from treino where idplanilha = ${request.params.idPlanilha} and ${sqlPlanilhaAtleta} and data = '${request.body.dataTreino}'`, (error, results) => {

        if (results.rows.length > 0 && results.rows[0].id > 0) {
            idTreino = results.rows[0].id;
            InsertExercicios(idTreino, request.body.partesTreino)
            if (error) {
                throw error
            }
            response.status(200).json(results.rows[0])
        }
        else {
            pool.query(`insert into treino (id, idplanilha, idplanilhaatleta, data, observacao) 
                    values (default,
                            ${request.params.idPlanilha},
                            ${idPlanilhaAtleta},
                            '${request.body.dataTreino}',
                            null)
                returning id`, (error, results) => {

                idTreino = results.rows[0].id;
                InsertExercicios(idTreino, request.body.partesTreino)

                if (error) {
                    throw error
                }
                response.status(200).json(results.rows[0])
            })
        }

        if (error) {
            throw error
        }
    })
}

const InsertExercicios = (idTreino, partesTreino) => {

    pool.query(`delete from exerciciostreino where idTreino = ${idTreino}`, (error, results) => {
        if (error) {
            throw error
        }
    })

    partesTreino.forEach((parteTreino) => {
        parteTreino.exercicios.forEach((exercicio) => {
            pool.query(`insert into exerciciostreino 
                             (idexercicio, idTreino, exercicio, repeticoes, peso, linkajuda, partetreino, descricaopartetreino, descanso, exerciciolivre) 
                        values (default, ${idTreino},'${exercicio.exercicio}','${exercicio.repeticoes}','${exercicio.peso}','${exercicio.linkajuda}','${parteTreino.titulo}','${parteTreino.descricao}','${exercicio.descanso}', null)`, (error, results) => {
                if (error) {
                    throw error
                }
            })
        })
    });
}

const loginOAuth = (request, response) => {

    let nome = request.body.displayName;
    let email = request.body.email;
    let uid = request.body.uid;

    pool.query(`select usuario.id, nome, email, ehcoach, pa.situacaopagamento
                from usuario left join planilhaatleta pa on pa.idatleta = usuario.id
                where email = '${email}'`, (error, results) => {
        if (error) {
            throw error
        }

        if (results.rows.length > 0) {
            if (results.rows[0].ehcoach || results.rows[0].situacaopagamento == 'ativo') {
                const id = results.rows[0].id;
                var token = gerarToken(id)

                return response.json({ auth: true, accessToken: token, id: results.rows[0].id, name: results.rows[0].nome, ehcoach: results.rows[0].ehcoach, email: results.rows[0].email });
            }
            else {
                response.json({ message: 'Conta cancelada!' });
            }
        }
        else {
            pool.query(`insert into usuario (id, idcoach, ehcoach, nome, email, senha, endereco, bairro, estado, cep) 
            values (default, 1, false, '${nome}', '${email}', '${uid}', null, null, null, null)
            returning id`, (error, results) => {
                if (error) {
                    throw error
                }

                idUser = results.rows[0].id;
                inserirPlanilhaAtleta(5, idUser);

                var token = gerarToken(idUser)

                return response.json({
                    auth: true,
                    accessToken: token,
                    id: results.rows[0].id,
                    name: nome,
                    ehcoach: false,
                    email: email
                });
            })
        }
    })
}

const inserirPlanilhaAtleta = (idPlanilha, idAtleta) => {
    pool.query(`insert into planilhaatleta (id, idplanilha, idcoach, idatleta, situacaopagamento)
                values (DEFAULT, ${idPlanilha}, 1, ${idAtleta},'ativo')`, (error, results) => {
        if (error) {
            throw error
        }
    })

}

const loginUser = (request, response) => {

    pool.query(`select usuario.id, nome, email, ehcoach, pa.situacaopagamento
                from usuario left join planilhaatleta pa on pa.idatleta = usuario.id
                where email = '${request.body.user}' and senha = '${request.body.pwd}'`, (error, results) => {
        if (error) {
            throw error
        }

        if (results.rows.length > 0) {
            if (results.rows[0].ehcoach || results.rows[0].situacaopagamento == 'ativo') {

                const id = request.body.uid;
                var token = gerarToken(id)
                return response.json({ auth: true, accessToken: token, id: results.rows[0].id, name: results.rows[0].nome, ehcoach: results.rows[0].ehcoach, email: results.rows[0].email });
            }
            else {
                response.json({ message: 'Conta cancelada!' });

            }
        }
        else {

            response.json({ message: 'Login inválido!' });
        }
    })
}

const getChartTreinosRealizados = (request, response) => {

    var infoChart = {
        meses: [],
        realizados: [],
        programados: []
    };


    var anoAtual = new Date().getFullYear()
    var date_start = new Date(anoAtual, 0)     // remember months start with 0
    var date_end = new Date(anoAtual, 11)       // remember months start with 0
    var date_count = date_start


    pool.query(`SELECT treino.id, treino.data, treinoatleta.done
    FROM treino 
    left join treinoatleta on treino.id = treinoatleta.idtreino and treinoatleta.idatleta =  18
    WHERE
    treino.data >= '${anoAtual}-01-01' and treino.data <= '${anoAtual}-12-31' and
    treino.idplanilha = (select idplanilha from planilhaatleta where idAtleta = ${request.params.idAtleta})`, (error, results) => {
        if (error) {
            throw error
        }
        if (results.rows.length > 0) {

            var mesAtual = new Date().getMonth();

            while (date_count <= date_end) {

                var mesIteracao = date_count.getMonth();

                treinosMes = results.rows.filter(a=> new Date(a.data).getMonth() == mesIteracao);
                treinosConcluidos = treinosMes.filter(a=> a.done);

                if (date_count.getMonth() <= new Date().getMonth()) {
                    infoChart.realizados.push(treinosConcluidos.length)
                    infoChart.programados.push(treinosMes.length)
                }
                else {
                    infoChart.realizados.push(0)
                    infoChart.programados.push(0)
                }
                date_count.setMonth(date_count.getMonth() + 1)
            }
        }

        return response.json(infoChart);

    })
}

function filterData(value)
{

}

const gerarToken = (id) => {
    var token = jwt.sign({ id }, config.get('api.jwtsecret'), {
        expiresIn: 3600 // expires in 5min
    });

    return token;
}


module.exports = {
    getCoachs,
    getUsers,
    getUser,
    loginUser,
    loginOAuth,
    getTraining,
    getTrainingDates,
    getAtleta,
    getPR,
    getPRHistory,
    getAtletas,
    getPerfilTreinador,
    getPlanilhas,
    getPlanilha,
    getPlanilhasAtletas,
    getProgramTrainingDates,
    getTreinoPlanilha,
    getChartTreinosRealizados,

    updateAtleta,
    updateCoach,
    updatePlanilha,
    updatePlanilhaAtleta,
    updateStatusAtleta,

    insertPRHistory,
    insertPlanilha,
    insertTreino,
    insertTreinoDone,

    deletePRHistory,
    deletePlanilha
}