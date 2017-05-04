const grpc = require('grpc');
const path = require('path');
const dns = require('dns');
const fs = require('fs');
const npm = new (require('./npm.js'));

const MASTER_ROLE = 'master';

const CONFIG_JSON_FILE_NAME = 'config.roles.json';

const CONNECT_RETRY_INTERVAL = 2000;

const servicePath = 'e:/work/nodeorcservices'; // TODO: THIS IS HARD CODED RIGHT NOW.. NEED TO ALLOW THIS TO BE CONFIGURED

class nodeorcMinion {
  constructor(rolesConfigPath) {
    this.configPath = path.resolve(rolesConfigPath);
    this.configRoles = require(path.resolve(this.configPath + '/' + CONFIG_JSON_FILE_NAME));

    this.connectToMaster = false; // TODO: SORT THIS OUT
  }

  initialize() {
    return new Promise((resolve, reject) => {
      dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
        console.log(hostname, service);
        // Prints: localhost ssh
      });
    });
  }

  getRole(roleName) {
    let foundRole = null;
    this.configRoles.forEach(function(role) {
      if (role.role === roleName) {
        foundRole = role;
      }
    });

    return foundRole;
  }

  getMasterRole() {
    return this.getRole(MASTER_ROLE);
  }



  tryRegisterMinion(retriesLeft, previousResolve, previousReject) {
    let promise;
    let promiseResolve;
    let promiseReject;
    if (typeof previousResolve !== 'undefined' &&
      typeof previousReject !== 'undefined') {
      promiseResolve = previousResolve;
      promiseReject = previousReject;
    } else {
      promise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        promiseReject - reject;
      });
    }

    console.log('Trying to connect to master');

    this.client.registerMinion({roleName: 'web'}, (err, response) => {
      if (err != null) {
        if (retriesLeft <= 0) {
          promiseReject();
        } else {
          setTimeout(() => {
            this.tryRegisterMinion(retriesLeft - 1, promiseResolve, promiseReject);
          }, CONNECT_RETRY_INTERVAL)
        }
      } else {
        console.log('Configured role for this minion:', response.role);
        promiseResolve(response);
      }
    });

    return promise;
  }

  start() {
    return new Promise((resolve, reject) => {
      this.initialize();

      this.masterservice_proto = grpc.load('./proto/master.proto').masterservice;

      let masterRole = this.getMasterRole();
      this.client = new this.masterservice_proto.MasterService(masterRole.address /*'localhost:50051'*/, grpc.credentials.createInsecure());


      npm.createNpmPackageFileIfNone(servicePath).then(() => {
        // Install packages
        return npm.install(['lodash'], servicePath);
      }).then((response) => {
        // Try to connect to the master
        return this.tryRegisterMinion(10);
      }).then((response) => {
        console.log('Minion registered');

        // The response should have the services we need to set up


        let service = {};

        service.serviceName = response.serviceName;
        service.serviceDir = path.resolve(servicePath + '/' + response.serviceName);
        service.servicePackageName = response.packageName;
        service.scriptFilePath = path.resolve(service.serviceDir + '/' + response.scriptFileName);
        service.protoFilePath = path.resolve(service.serviceDir + '/' + response.protoFileName);

        if (!fs.existsSync(servicePath)) {
          fs.mkdirSync(servicePath);
        }
        if (!fs.existsSync(service.serviceDir)) {
          fs.mkdirSync(service.serviceDir);
        }
        fs.writeFileSync(service.scriptFilePath, response.scriptContent);
        fs.writeFileSync(service.protoFilePath, response.protoContent);


        service.service_proto = grpc.load(service.protoFilePath)[response.packageName];
        service.server = new grpc.Server();
        service.server.bind('localhost:50052', grpc.ServerCredentials.createInsecure()); // TODO: NEED TO RESOLVE ADDRESS A PORT! NOT HARD CODE IT

        // Create the service instance
        let serviceClass = require(service.scriptFilePath);
        let serviceInstance = new serviceClass('created by the minion');

        // Add the service instance to the grpc server
        service.server.addService(service.service_proto[response.serviceName].service, serviceInstance);

        // Start the grpc server
        service.server.start();

        this.services = [];
        this.services.push(service);

        this.client.minionServerCreated(
          {
            addressAndPort: 'localhost:50052',
            role: 'web'
          }, (err, response) => { // TODO: NEED TO RESOLVE ADDRESS A PORT! NOT HARD CODE IT
            if (err != null) {
              resolve();
            } else {
              reject();
            }
          });
      }).catch(() => {
        console.log('Minion could not be registered');
        reject();
      });




    });
  }
}

module.exports = nodeorcMinion;