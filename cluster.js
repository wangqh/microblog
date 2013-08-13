var cluster = require('cluster');
// 获取 cpu 的数量
var numCPUs = require('os').cpus().length;

var workers = {};
if(cluster.isMaster){
	// 主进程分支
	
	// 初始开启与CPU数量相同的工作进程
	for(var i = 0; i < numCPUs; i++){
		var worker = cluster.fork();
		workers[worker.process.pid] = worker;
	}
	cluster.on('exit', function(worker, code, signal){
		// 当一个工作进程结束时，重启工作进程
		delete workers[worker.process.pid];
		worker = cluster.fork();
		workers[worker.process.pid] = worker;
	});
} else {
	// 工作进程分支，启动服务器。
	var app = require('./app');
	app.listen(3000);

}
// 当主进程被中止时，关闭所有工作进程
process.on('SIGTEAM', function(){
	for(var pid in workers){
		process.kill(pid);
	}
	process.exit(0);
});