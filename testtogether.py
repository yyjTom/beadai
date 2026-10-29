import os
from together import Together

# 1. 填入你的真实 API Key 
client = Together(api_key="tgp_v1_WeK5lmFw9SBZ1wsLbKP_UsJfkbrj-RuT83eR0qL-Tmk")

# 2. 调用图像生成接口（替换原有的 chat 文本接口）
response = client.images.generate(
    model="black-forest-labs/FLUX.2-dev",
    prompt="a cute pixel art puppy, fuse bead style, clean flat vector background, 8-bit game sprite, high contrast, vibrant solid colors",
    width=512,
    height=512,
    steps=4,
    n=1
)

# 3. 打印 AI 为你生成的超高清像素拼豆原图网址
print("AI 图像生成成功！请复制下方网址到浏览器查看：")
print(response.data[0].b64_json)
print(response.data[0].url)


