// Provide a default path to dwr.engine
if (dwr == null) var dwr = {};
if (dwr.engine == null) dwr.engine = {};
if (DWREngine == null) var DWREngine = dwr.engine;

if (WikiDelegate == null) var WikiDelegate = {};
WikiDelegate._path = '/dwr';
WikiDelegate.getArticle = function(p0, p1, callback) {
  dwr.engine._execute(WikiDelegate._path, 'WikiDelegate', 'getArticle', p0, p1, callback);
}
WikiDelegate.listAll = function(p0, callback) {
  dwr.engine._execute(WikiDelegate._path, 'WikiDelegate', 'listAll', p0, callback);
}
WikiDelegate.updateArticle = function(p0, callback) {
  dwr.engine._execute(WikiDelegate._path, 'WikiDelegate', 'updateArticle', p0, callback);
}
