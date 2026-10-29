"""Prepare one lab fault without executing Docker or changing the base files."""

import argparse
import json
from pathlib import Path
import secrets
import shlex


def prepare(case, output, project):
    output.mkdir(parents=True, exist_ok=False)
    source = Path(__file__).resolve().parent
    if case == "A":
        override = {"services": {"api": {"environment": {"BIND_HOST": "127.0.0.1"}}}}
        answer = {
            "root_cause": "API 只监听自己的回环接口。",
            "observations": ["api 可能仍然健康，因为健康检查访问的是 127.0.0.1。",
                             "gateway 无法从 back 网络连接这个回环监听。"],
            "repair": "恢复 BIND_HOST=0.0.0.0，重建 api，再从 gateway 入口重复请求。",
        }
    elif case == "B":
        config = output / "gateway.conf"
        config.write_text('''server {
    listen 80;
    resolver 127.0.0.11 valid=5s;
    location / {
        set $api http://missing-api:8000;
        proxy_pass $api;
        proxy_connect_timeout 2s;
    }
}
''')
        override = {"services": {"gateway": {"volumes": [
            {"type": "bind", "source": str(config),
             "target": "/etc/nginx/conf.d/default.conf", "read_only": True}
        ]}}}
        answer = {
            "root_cause": "代理使用了 back 网络中不存在的服务名。",
            "observations": ["API 回环就绪检查和通过真实服务名的访问正常。",
                             "gateway 日志报告上游名字解析错误。"],
            "repair": "恢复上游 api:8000，重建 gateway，再验证原始请求。",
        }
    else:
        override = {"services": {"api": {"environment": {"DATA_DIR": "/tmp/volatile-orders"}}}}
        answer = {
            "root_cause": "数据库路径指向 tmpfs，没有使用 orders 数据卷。",
            "observations": ["/health 与 /ready 都可能通过。",
                             "新订单在停止后再启动或重建时消失。",
                             "原来的 orders 卷仍挂在 /data，数据身份不同。"],
            "repair": "恢复 DATA_DIR=/data 并重建 api，再核对原业务数据。",
        }
    (output / "override.json").write_text(json.dumps(override, ensure_ascii=False, indent=2) + "\n")
    (output / "answer.json").write_text(json.dumps({"case": case, **answer}, ensure_ascii=False, indent=2) + "\n")
    args = ["docker", "compose", "-p", project, "-f", str(source / "compose.yaml")]
    apply = shlex.join([*args, "-f", str(output / "override.json"), "up", "-d", "--wait"])
    reset = shlex.join([*args, "up", "-d", "--wait", "--force-recreate"])
    instructions = (
        "本工具只准备配置，不执行 Docker。使用独立实验项目；保留原来的 LAB_PORT/LAB_IMAGE。\n"
        "先保存基线订单与配置，再加载一次故障：\n" + apply + "\n\n"
        "提交：现象、至少两个假设、能区分假设的观测、根因、最小修复与业务复验。\n"
        "提交后再阅读同目录 answer.json 对照；它不是自动评分。\n\n"
        "恢复基础配置（保留本项目数据卷）：\n" + reset + "\n"
    )
    (output / "challenge.txt").write_text(instructions)
    print(instructions)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", choices=["A", "B", "C", "random"], default="random")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--project", default="learn-u18")
    args = parser.parse_args()
    chosen = secrets.choice(["A", "B", "C"]) if args.case == "random" else args.case
    try:
        prepare(chosen, args.output.resolve(), args.project)
    except FileExistsError:
        parser.error("output directory already exists; choose a new evidence directory")
