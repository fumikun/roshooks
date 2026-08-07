---
layout: home

hero:
  name: roshooks
  text: roslib.js を React Hooks で
  tagline: rosbridge 経由で ROS / ROS 2 に接続する React アプリを、宣言的な Hooks で書けるようにする TypeScript ライブラリ
  actions:
    - theme: brand
      text: はじめに
      link: /ja/guide/getting-started
    - theme: alt
      text: APIリファレンス
      link: /ja/api/ros-provider

features:
  - title: 接続のライフサイクル管理
    details: RosProvider が roslib.Ros の接続を1つ保持し、接続状態(connecting / connected / closed / error)を Context 経由で配下に配信します。
  - title: トピックの購読・配信
    details: useTopic / usePublisher で、コンポーネントのライフサイクルに合わせた自動購読・自動アドバタイズと、アンマウント時の後片付けを行います。
  - title: サービス・パラメータ・アクション・TF
    details: useService / useParam / useAction / useTF で ROS / ROS 2 の主要な機能を一通り Hooks 化しています。
  - title: フルTypeScript
    details: メッセージ型をジェネリクスで指定でき、roslib.js が同梱する型定義をそのまま活用します。
---
