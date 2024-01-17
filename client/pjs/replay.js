((

  config = JSON.decode(pipy.load('config.json')),

  db = sqlite('pipy.db'),

  { insert_replay_pipy_db } = pipy.solve('db.js'),

) => pipy({
  _id: null,
  _newId: null,
  _infos: null,
  _target: null,
  _record: null,
  _beginTime: null,
  _statusCode: null,
  _message: undefined,
  _responseHeadText: null,
  _responseBodyBlob: null,
})

.pipeline()
.onStart(new Data)
.replaceMessage(
  msg => (
    (_id = msg?.head?.path?.split?.('?')?.[1]?.split?.('=')?.[1]) && (
      (_record = db.sql('select * from pipy where id = ?').bind(1, _id).exec()?.[0]) && (
        _target = JSON.decode(_record?.infos || new Data('{}'))?.target
      )
    ),
    !_record ? (
      _message = new Message({ status: 200 }, JSON.encode({ error: "Invalid id: " + _id }))
    ) : !_record.request_head ? (
      _message = new Message({ status: 200 }, JSON.encode({ error: "Please enable saveHeadAndBody, id: " + _id }))
    ) : !_target ? (
      _message = new Message({ status: 200 }, JSON.encode({ error: "Bad infos, id: " + _id }))
    ) : (
      _beginTime = Date.now(),
      _message = null,
      _infos = { originalID: _id },
      [
        new MessageStart(JSON.decode(new Data(_record?.request_head))),
        _record?.request_body,
        new MessageEnd
      ]
    )
  )
)
.branch(
  () => _message, (
    $=>$
  ),
  () => _message === null, (
    $=>$.link('replay')
  )
)

.pipeline('replay')
.muxHTTP().to(
  $=>$.branch(
    () => _record.scheme === 'https', (
      $=>$.connectTLS({ sni: () => _target.split(':')[0] }).to(
        $=>$.connect(() => _target, { ...config?.policies, onState: ob => (_infos[ob.state + 'TS'] = Date.now()) })
      )
    ),
    (
      $=>$.connect(() => _target, { ...config?.policies, onState: ob => (_infos[ob.state + 'TS'] = Date.now()) })
    )
  )
)
.handleMessageStart(
  msg => (
    _statusCode = (msg?.head?.status || 0),
    config?.configs?.saveHeadAndBody && (
      _responseBodyBlob = new Data,
      _responseHeadText = JSON.stringify(msg.head, null, 2)
    )
  )
)
.branch(
  config?.configs?.saveHeadAndBody, (
    $=>$.handleData(
      dat => _responseBodyBlob.push(dat)
    )
  )
)
.handleMessageEnd(
  msg => (
    _infos.target = _target,
    _infos.doneProxyTS = Date.now(),
    _newId = insert_replay_pipy_db(
      _record.scheme,
      '127.0.0.1',
      _record.host,
      _record.url,
      _record.user_agent,
      new Date() - _beginTime,
      _statusCode,
      _record.request_head,
      _record.request_body,
      _responseHeadText,
      _responseBodyBlob,
      _record.request_size,
      (msg?.tail?.headSize || 0) + (msg?.tail?.bodySize || 0),
      JSON.encode(_infos)
    )?.id || -1
  )
)
.branch(
  () => _newId >= -1, (
    $=>$.replaceMessage(
      () => new Message({ status: 200 }, JSON.encode({ id: _newId }))
    )
  )
)

)()