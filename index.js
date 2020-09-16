const config = require('config');

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./queries')
const port = process.env.PORT || config.get('api.port')
var jwt = require('jsonwebtoken');
var cors = require('cors')


app.use(cors())
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})

app.get('/api/coachs', verifyJWT, db.getCoachs)
app.get('/api/users', verifyJWT, db.getUsers)
app.get('/api/user/:id', verifyJWT, db.getUser)
app.get('/api/training/:idAtleta/:selectedDate', verifyJWT, db.getTraining)
app.get('/api/trainingDates/:idAtleta', verifyJWT, db.getTrainingDates)
app.get('/api/programtrainingdates/:idProgram', verifyJWT, db.getProgramTrainingDates)
app.get('/api/atleta/:idAtleta', verifyJWT, db.getAtleta)
app.get('/api/atletas/:idCoach', verifyJWT, db.getAtletas)
app.get('/api/personalrecord/:idAtleta', verifyJWT, db.getPR)
app.get('/api/personalrecordhistory/:idAtleta/:idMovimento', verifyJWT, db.getPRHistory)
app.get('/api/coach/:idCoach', verifyJWT, db.getPerfilTreinador)
app.get('/api/planilhas/:idCoach', verifyJWT, db.getPlanilhas)
app.get('/api/planilha/:idPlanilha', verifyJWT, db.getPlanilha)
app.get('/api/planilhasatleta/:idCoach', verifyJWT, db.getPlanilhasAtletas)
app.get('/api/treinoplanilha/:idPlanilha/:selectedDate', verifyJWT, db.getTreinoPlanilha)
app.get('/api/chartTreinosRealizados/:idAtleta', verifyJWT, db.getChartTreinosRealizados)


app.put('/api/atleta/:idAtleta', verifyJWT, db.updateAtleta);
app.put('/api/statusatleta/:idAtleta', verifyJWT, db.updateStatusAtleta);
app.put('/api/coach/:idCoach', verifyJWT, db.updateCoach);
app.put('/api/planilha/:idPlanilha', verifyJWT, db.updatePlanilha);
app.put('/api/planilhaatleta/:idPlanilha/:idAtleta', verifyJWT, db.updatePlanilhaAtleta);

app.post('/api/prhistory/:idAtleta/:idMovimento', verifyJWT, db.insertPRHistory);
app.post('/api/planilha/:idCoach', verifyJWT, db.insertPlanilha);
app.post('/api/treino/:idCoach/:idPlanilha/:idPlanilhaAtleta', verifyJWT, db.insertTreino);
app.post('/api/treinodone/:idAtleta', verifyJWT, db.insertTreinoDone);

app.delete('/api/prhistory/:idAtleta/:idMovimento', verifyJWT, db.deletePRHistory);
app.delete('/api/planilha/:idCoach/:idPlanilha', verifyJWT, db.deletePlanilha);


//authentication
app.post('/api/login', db.loginUser)
app.post('/api/loginoauth', db.loginOAuth)

app.post('/api/logout', function(req, res) {
  res.json({ auth: false, token: null });
})


function verifyJWT(req, res, next){
    var token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, config.get('api.jwtsecret'), function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      // se tudo estiver ok, salva no request para uso posterior
      req.userId = decoded.id;
      next();
    });
}