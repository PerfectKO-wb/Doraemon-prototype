Skip navigation
数据表
表结构
invoice_unified_document
bank_unified_transaction
business_voucher
amortization_schedule
        ↓
accounting_transaction
        ↓
accounting_source_link
        ↓
accounting_event
        ↓
      AI JE
2，3，4 → F agent → match → 生成 JE
1 → OCR agent → F agent → match → 生成JE

手动生成JE→F agent

DDL
--
-- Table structure for `bank_unified_transaction`
--
CREATE TABLE `bank_unified_transaction` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `bank_reference` varchar(128) NOT NULL COMMENT '银行参考号/交易流水号',
  `customer_reference` varchar(128) NOT NULL DEFAULT '' COMMENT '客户参考号',
  `group_id` varchar(128) NOT NULL COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',
  `transaction_date` date NOT NULL COMMENT '交易日期/记账日',
  `accounting_date` date NOT NULL DEFAULT '1970-01-01' COMMENT '会计记账日期',
  `value_date` date DEFAULT NULL COMMENT '起息日/结算日',
  `amount` decimal(20,4) NOT NULL COMMENT '交易金额',
  `currency` varchar(16) NOT NULL COMMENT '货币代码 (USD/JPY/SGD等)',
  `bank_account_id` bigint(20) unsigned NOT NULL COMMENT '银行账户主键ID',
  `transaction_type` varchar(255) NOT NULL DEFAULT '' COMMENT '交易类型',
  `transfer_type` varchar(255) NOT NULL DEFAULT '' COMMENT '转账类型',
  `description_raw` text DEFAULT NULL COMMENT '交易描述/摘要原始数据',
  `memo` text DEFAULT NULL COMMENT '备注（JE生成时自动填充）',
  `memo_created_by` varchar(64) NOT NULL DEFAULT '' COMMENT '备注创建者',
  `clearing_status` varchar(32) NOT NULL DEFAULT 'INIT' COMMENT '对账状态',
  `trans_workflow` json COMMENT '工作流状态',
  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `counterparty` json COMMENT '对手方信息',
  `sub_transaction_batch_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '子账批次ID（仅子账明细有值）',
  `ext_data` json COMMENT '扩展字段（银行特有字段）',
  `raw_data` json COMMENT '原始数据（保留银行原始字段）',
  `upload_by` varchar(64) NOT NULL DEFAULT '' COMMENT '上传者',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_accounting_date` (`accounting_date`),
  KEY `idx_bank_account_id` (`bank_account_id`),
  KEY `idx_bank_reference` (`bank_reference`),
  KEY `idx_clearing_status` (`clearing_status`),
  KEY `idx_company_code` (`company_code`),
  KEY `idx_currency` (`currency`),
  KEY `idx_sub_transaction_batch_id` (`sub_transaction_batch_id`),
  KEY `idx_transaction_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='统一流水记录表';


--
-- Table structure for `business_voucher`
--
CREATE TABLE `business_voucher` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',
  `voucher_type` varchar(32) NOT NULL COMMENT '业务类型',
  `description` text DEFAULT NULL COMMENT '详细说明（业务方录入，工作流据此生成 JE）',
  `currency` varchar(16) NOT NULL COMMENT '币种',
  `amount` decimal(20,4) NOT NULL DEFAULT '0' COMMENT '金额',
  `accounting_date` date NOT NULL COMMENT '会计记账日期',
  `status` varchar(32) NOT NULL DEFAULT 'INIT' COMMENT '处理状态',
  `trans_workflow` json COMMENT '工作流任务列表',
  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `ext_data` json COMMENT '业务自定义扩展',
  `created_by` varchar(128) NOT NULL DEFAULT '' COMMENT '创建者邮箱',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间（软删除）',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_accounting_date` (`accounting_date`),
  KEY `idx_company_code` (`company_code`),
  KEY `idx_status` (`status`),
  KEY `idx_voucher_type` (`voucher_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='通用业务凭证表';




CREATE TABLE `invoice_unified_document` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',

  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',

  -- document identity
  `document_type` varchar(64) NOT NULL DEFAULT 'INVOICE' COMMENT 'INVOICE/RECEIPT/CREDIT_NOTE/DEBIT_NOTE/PAYMENT_REPORT/ROYALTY_STATEMENT/STATEMENT',
  `invoice_direction` varchar(32) NOT NULL DEFAULT 'PURCHASE' COMMENT 'PURCHASE/SALES',
  `region_code` varchar(32) NOT NULL DEFAULT '' COMMENT '地区代码，如JP/US/SG',

  -- counterparty
  `vendor_name` varchar(255) NOT NULL DEFAULT '' COMMENT '供应商/交易对手方名称，未知时为空字符串',
  `vendor_code` varchar(128) NOT NULL DEFAULT '' COMMENT '供应商编码',

  -- payment instruction: payee
  `payee_name` varchar(255) NOT NULL DEFAULT '' COMMENT '收款方名称',
  `payee_bank_name` varchar(255) NOT NULL DEFAULT '' COMMENT '收款方银行名称',
  `payee_account_no` varchar(512) NOT NULL DEFAULT '' COMMENT '收款方账号，MVP阶段可明文，后续建议加密/脱敏',

  -- payment instruction: payer
  `payer_bank_name` varchar(255) NOT NULL DEFAULT '' COMMENT '付款方银行名称',
  `payer_account_name` varchar(255) NOT NULL DEFAULT '' COMMENT '付款方账户名',

  -- invoice document fields
  `invoice_number` varchar(255) NOT NULL DEFAULT '' COMMENT 'invoice编号，未知时为空字符串',
  `invoice_date` date DEFAULT NULL COMMENT 'invoice开具日期/文档日期',
  `due_date` date DEFAULT NULL COMMENT '付款到期日',

  -- period fields
  `service_period_start` date DEFAULT NULL COMMENT '服务/结算期间开始',
  `service_period_end` date DEFAULT NULL COMMENT '服务/结算期间结束',
  `accounting_date` date DEFAULT NULL COMMENT '默认会计日期，用于初始会计事件；NORMALIZED/READY前可为空',

  -- amount fields
  `currency` varchar(16) DEFAULT NULL COMMENT '币种，抽取前可为空',
  `total_amount` decimal(20,4) DEFAULT NULL COMMENT '含税总额；NULL表示未知，不用0代表未知',
  `amount_excluding_tax` decimal(20,4) DEFAULT NULL COMMENT '不含税总额；NULL表示未知',
  `tax_amount` decimal(20,4) DEFAULT NULL COMMENT '税额总额；NULL表示未知',
  `tax_breakdown` json DEFAULT NULL COMMENT '按税率拆分的税额明细',

  -- optional tax registration info extracted from invoice
  `tax_registration_no` varchar(128) NOT NULL DEFAULT '' COMMENT '适格請求書番号/税务登记号，如有则记录',

  -- business description
  `payment_purpose` varchar(512) NOT NULL DEFAULT '' COMMENT '付款用途',
  `payment_type` varchar(64) NOT NULL DEFAULT '' COMMENT '付款类型/业务类型',
  `business_category` varchar(128) NOT NULL DEFAULT '' COMMENT '业务分类，如ROYALTY/SAAS/CLOUD/COMMUNICATION',
  `invoice_description` text DEFAULT NULL COMMENT 'invoice业务说明',

  -- recognition / allocation instruction
  `allocation_required` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要跨期分摊',
  `allocation_method` varchar(64) NOT NULL DEFAULT '' COMMENT 'MONTHLY_EQUAL/DAILY_PRORATA/MANUAL/MONTHLY_BY_LINE_ITEM',
  `recognition_policy` varchar(64) NOT NULL DEFAULT 'IMMEDIATE' COMMENT '费用确认策略：IMMEDIATE/PREPAID_MONTHLY/PREPAID_DAILY/ACCRUAL_BY_SERVICE_PERIOD/MONTHLY_BY_LINE_ITEM',

  -- source / file
  `source_channel` varchar(64) NOT NULL DEFAULT 'UPLOAD' COMMENT 'UPLOAD/API/EMAIL/OCR/MANUAL',
  `document_hash` varchar(255) DEFAULT NULL COMMENT '结构化内容hash，用于invoice业务去重；抽取完成后生成，可为空',
  `storage_provider` varchar(64) NOT NULL DEFAULT 'S3' COMMENT 'S3/GCS/LOCAL/OSS',
  `storage_key` varchar(1024) NOT NULL DEFAULT '' COMMENT '原始invoice文件存储路径',
  `file_name` varchar(255) NOT NULL DEFAULT '' COMMENT '原始文件名',
  `file_hash` varchar(255) DEFAULT NULL COMMENT '文件hash，用于文件级去重；没有文件时可为空',

  -- processing status
  `extraction_status` varchar(32) NOT NULL DEFAULT 'INIT' COMMENT 'INIT/EXTRACTED/FAILED/MANUAL_REVIEW',
  `matching_status` varchar(32) NOT NULL DEFAULT 'INIT' COMMENT 'INIT/MATCHING/MATCHED/UNMATCHED/DUPLICATE',
  `status` varchar(32) NOT NULL DEFAULT 'INIT' COMMENT 'INIT/NORMALIZED/READY/CONFIRMED/CANCELLED',

  -- flexible data
  `line_items` json DEFAULT NULL COMMENT 'invoice line明细，MVP阶段先放JSON',
  `ext_data` json DEFAULT NULL COMMENT '扩展字段',

  -- control fields
  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除，配合deleted_at做软删除和唯一约束',
  `created_by` varchar(128) NOT NULL DEFAULT '' COMMENT '创建者邮箱',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '软删除时间',

  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,

  KEY `idx_group_company` (`group_id`, `company_code`),
  KEY `idx_company_accounting_date` (`company_code`, `accounting_date`),
  KEY `idx_company_invoice_date` (`company_code`, `invoice_date`),
  KEY `idx_vendor_name` (`vendor_name`),
  KEY `idx_invoice_number` (`invoice_number`),
  KEY `idx_document_type` (`document_type`),
  KEY `idx_region_code` (`region_code`),
  KEY `idx_business_category` (`business_category`),
  KEY `idx_payment_type` (`payment_type`),
  KEY `idx_matching_status` (`matching_status`),
  KEY `idx_status` (`status`),
  KEY `idx_file_hash` (`file_hash`),
  KEY `idx_document_hash` (`document_hash`),
  KEY `idx_storage_key` (`storage_key`(255)),

  UNIQUE KEY `uk_invoice_file_hash`
    (`group_id`, `company_code`, `file_hash`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='统一invoice/receipt/payment report文档表';⁠⁠
"tax_breakdown": [
 {
 "tax_category": "TAXABLE_10",
 "tax_rate": "0.1000",
 "tax_rate_display": "10%",
 "taxable_amount": "5937847.0000",
 "tax_amount": "593785.0000",
 "tax_inclusive_amount": "6531632.0000"
 }
 ],

document_hash

normalize后hash

invoice_number 存在：

group_id
company_code
document_type
invoice_direction
region_code
vendor_name_normalized
invoice_number
invoice_date
currency
total_amount
不存在：

group_id
company_code
document_type
invoice_direction
region_code
vendor_name_normalized
payment_purpose_normalized
service_period_start
service_period_end
currency
total_amount
例：


例子：




8451.pdf



accounting_transaction = 去重后的业务事实
accounting_source_link = 原始来源与业务事实的关联
accounting_event = 真正触发 AI 生成 JE 的会计事件
1. accounting_transaction
这张表表示“去重后的一笔真实业务交易”。

例如：

AWS 2026-04 SaaS 费用 110,000 JPY
株式会社ホビージャパン 2026 Q1 royalty payable 6,531,632 JPY
CREATE TABLE `accounting_transaction` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',

  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',

  -- business identity
  `transaction_type` varchar(64) NOT NULL COMMENT 'EXPENSE/REVENUE/PAYMENT/TRANSFER/ACCRUAL/ADJUSTMENT',
  `transaction_direction` varchar(32) NOT NULL DEFAULT '' COMMENT 'OUTGOING/INCOMING/NONE',
  `business_category` varchar(128) NOT NULL DEFAULT '' COMMENT '业务分类，如SAAS/CLOUD/ROYALTY/COMMUNICATION/TRAVEL',

  -- counterparty
  `counterparty_name` varchar(255) NOT NULL DEFAULT '' COMMENT '交易对手方名称',
  `counterparty_code` varchar(128) NOT NULL DEFAULT '' COMMENT '交易对手方编码',
  `counterparty_key` varchar(255) NOT NULL DEFAULT '' COMMENT '标准化后的交易对手方key，用于matching',

  -- amount
  `currency` varchar(16) NOT NULL COMMENT '币种',
  `total_amount` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '交易含税总额，通常用正数',
  `amount_excluding_tax` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '不含税金额',
  `tax_amount` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '税额',

  -- date / period
  `accounting_date` date NOT NULL COMMENT '主会计日期',
  `service_period_start` date DEFAULT NULL COMMENT '服务/结算期间开始',
  `service_period_end` date DEFAULT NULL COMMENT '服务/结算期间结束',

  -- recognition policy copied/resolved from source
  `allocation_required` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要跨期分摊',
  `allocation_method` varchar(64) NOT NULL DEFAULT '' COMMENT 'MONTHLY_EQUAL/DAILY_PRORATA/MANUAL',
  `recognition_policy` varchar(64) NOT NULL DEFAULT 'IMMEDIATE' COMMENT 'IMMEDIATE/PREPAID_MONTHLY/PREPAID_DAILY/ACCRUAL_BY_SERVICE_PERIOD',

  -- primary source
  `primary_source_type` varchar(64) NOT NULL DEFAULT '' COMMENT 'INVOICE/BANK_TRANSACTION/CARD_TRANSACTION/BUSINESS_VOUCHER/MANUAL',
  `primary_source_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '主source id',

  -- dedupe / matching
  `transaction_key` varchar(512) NOT NULL DEFAULT '' COMMENT '业务去重key的可读版本',
  `dedupe_hash` varchar(255) DEFAULT NULL COMMENT '业务去重hash，用于唯一约束',

  `matching_status` varchar(64) NOT NULL DEFAULT 'INIT' COMMENT 'INIT/PARTIAL_MATCHED/MATCHED/INVOICE_MISSING/WAITING_PAYMENT/DUPLICATE',
  `evidence_status` varchar(64) NOT NULL DEFAULT 'INIT' COMMENT 'INIT/INVOICE_ATTACHED/INVOICE_MISSING/WAIVED/EXEMPTED',
  `tax_status` varchar(64) NOT NULL DEFAULT 'UNKNOWN' COMMENT 'UNKNOWN/PENDING/CONFIRMED/NO_INPUT_TAX',

  -- accounting judgment, not raw invoice fields
  `tax_treatment` varchar(64) NOT NULL DEFAULT 'UNKNOWN' COMMENT '系统判断的税务处理：TAXABLE/EXEMPT/NON_TAXABLE/REVERSE_CHARGE/UNKNOWN',
  `input_tax_claimable` tinyint(1) NOT NULL DEFAULT '0' COMMENT '系统判断是否可作为进项税抵扣',
  `invoice_requirement_status` varchar(64) NOT NULL DEFAULT 'UNKNOWN' COMMENT 'UNKNOWN/REQUIRED/SATISFIED/EXEMPTED/MISSING/WAIVED_NO_INPUT_TAX',

  -- transaction status
  `status` varchar(64) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/PROVISIONAL/CONFIRMED/CLOSED/CANCELLED',

  `matching_score` decimal(10,4) NOT NULL DEFAULT '0.0000' COMMENT '匹配置信度',
  `matching_rule` varchar(255) NOT NULL DEFAULT '' COMMENT '命中的匹配规则',

  `ext_data` json DEFAULT NULL COMMENT '扩展字段',

  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '软删除时间',

  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,

  KEY `idx_group_company` (`group_id`, `company_code`),
  KEY `idx_company_accounting_date` (`company_code`, `accounting_date`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_business_category` (`business_category`),
  KEY `idx_counterparty_key` (`counterparty_key`),
  KEY `idx_primary_source` (`primary_source_type`, `primary_source_id`),
  KEY `idx_matching_status` (`matching_status`),
  KEY `idx_evidence_status` (`evidence_status`),
  KEY `idx_tax_status` (`tax_status`),
  KEY `idx_status` (`status`),
  KEY `idx_dedupe_hash` (`dedupe_hash`),

  UNIQUE KEY `uk_accounting_transaction_dedupe`
    (`group_id`, `company_code`, `dedupe_hash`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='去重后的会计业务交易表';
2. accounting_source_link
这张表解决：

这笔 accounting_transaction 是由哪些原始 source 组成的？
比如一笔 AWS 费用：

accounting_transaction_id = 5001

INVOICE 101          PRIMARY_EXPENSE_EVIDENCE
CARD_TRANSACTION 99  PAYMENT_EVIDENCE
BUSINESS_VOUCHER 8   MANUAL_NOTE
CREATE TABLE `accounting_source_link` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',

  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',

  `accounting_transaction_id` bigint(20) unsigned NOT NULL COMMENT 'accounting_transaction.id',
  `accounting_event_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'accounting_event.id，0表示只关联transaction层',

  -- source identity
  `source_type` varchar(64) NOT NULL COMMENT 'INVOICE/BANK_TRANSACTION/CARD_TRANSACTION/BUSINESS_VOUCHER/MANUAL',
  `source_id` bigint(20) unsigned NOT NULL COMMENT '来源表主键ID',

  -- source role
  `link_role` varchar(64) NOT NULL COMMENT 'PRIMARY_EXPENSE_EVIDENCE/PAYMENT_EVIDENCE/ATTACHMENT/PROVISIONAL_SOURCE/MANUAL_NOTE/REVERSAL_SOURCE',
  `match_type` varchar(64) NOT NULL DEFAULT '' COMMENT 'EXACT_AMOUNT/DATE_WINDOW/INVOICE_NO/DESCRIPTION/AI_MATCH/MANUAL',
  `confidence` decimal(10,4) NOT NULL DEFAULT '0.0000' COMMENT '匹配置信度',

  -- matched amount, useful for partial payment / batch payment
  `matched_amount` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '该source匹配到本transaction的金额',
  `matched_currency` varchar(16) NOT NULL DEFAULT '' COMMENT '匹配币种',

  `status` varchar(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/REJECTED/CANCELLED',

  `ext_data` json DEFAULT NULL COMMENT '扩展字段',

  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  `created_by` varchar(128) NOT NULL DEFAULT '' COMMENT '创建者',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '软删除时间',

  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,

  KEY `idx_group_company` (`group_id`, `company_code`),
  KEY `idx_accounting_transaction_id` (`accounting_transaction_id`),
  KEY `idx_accounting_event_id` (`accounting_event_id`),
  KEY `idx_source` (`source_type`, `source_id`),
  KEY `idx_link_role` (`link_role`),
  KEY `idx_status` (`status`),

  UNIQUE KEY `uk_accounting_source_link`
    (`group_id`, `company_code`, `accounting_transaction_id`, `source_type`, `source_id`, `link_role`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='会计交易与原始source关联表';
这里 unique key 里包含了 accounting_transaction_id，原因是要支持：

一个 bank transaction 拆分匹配多个 invoice
多个 invoice 合并对应一个 payment
一个 source 在不同 transaction 下按金额分摊
所以不能简单写成：

source_type + source_id + link_role 唯一
否则 batch payment / partial payment 会被挡住。

3. accounting_event
这张表是 AI JE generation 的唯一入口。

不要让 AI 直接消费：

invoice_unified_document
bank_unified_transaction
business_voucher
而是只消费：

accounting_event
CREATE TABLE `accounting_event` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',

  `group_id` varchar(128) NOT NULL DEFAULT '' COMMENT '集团ID',
  `company_code` varchar(128) NOT NULL COMMENT '公司编码',

  `accounting_transaction_id` bigint(20) unsigned NOT NULL COMMENT 'accounting_transaction.id',

  -- event identity
  `event_type` varchar(64) NOT NULL COMMENT 'EXPENSE_RECOGNITION/PAYMENT_SETTLEMENT/EVIDENCE_ATTACHMENT/ADJUSTMENT/MONTHLY_ALLOCATION/PREPAID_RECOGNITION/REVERSAL',
  `event_sub_type` varchar(64) NOT NULL DEFAULT '' COMMENT 'SAAS/CLOUD/ROYALTY/CARD_PAYMENT/TAX_ADJUSTMENT等',

  -- event date / period
  `event_date` date NOT NULL COMMENT '事件发生日期',
  `accounting_date` date NOT NULL COMMENT '会计入账日期',
  `period_key` varchar(32) NOT NULL DEFAULT '' COMMENT '会计期间，如2026-04',
  `service_period_start` date DEFAULT NULL COMMENT '服务/结算期间开始',
  `service_period_end` date DEFAULT NULL COMMENT '服务/结算期间结束',

  -- amount
  `currency` varchar(16) NOT NULL COMMENT '币种',
  `total_amount` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '事件含税金额，通常用正数',
  `amount_excluding_tax` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '不含税金额',
  `tax_amount` decimal(20,4) NOT NULL DEFAULT '0.0000' COMMENT '税额',

  -- tax judgment snapshot
  `tax_treatment` varchar(64) NOT NULL DEFAULT 'UNKNOWN' COMMENT '系统判断的税务处理：TAXABLE/EXEMPT/NON_TAXABLE/REVERSE_CHARGE/UNKNOWN',
  `input_tax_claimable` tinyint(1) NOT NULL DEFAULT '0' COMMENT '该event是否可生成进项税相关JE',
  `invoice_requirement_status` varchar(64) NOT NULL DEFAULT 'UNKNOWN' COMMENT 'UNKNOWN/REQUIRED/SATISFIED/EXEMPTED/MISSING/WAIVED_NO_INPUT_TAX',

  -- primary source for this event
  `primary_source_type` varchar(64) NOT NULL DEFAULT '' COMMENT 'INVOICE/BANK_TRANSACTION/CARD_TRANSACTION/BUSINESS_VOUCHER/MANUAL',
  `primary_source_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '主source id',

  -- AI input
  `event_memo` text DEFAULT NULL COMMENT '会计事件说明，Resolver生成，供AI生成JE使用',
  `source_snapshot` json DEFAULT NULL COMMENT '原始source事实快照，供AI生成JE使用',
  `account_rule_snapshot` json DEFAULT NULL COMMENT '匹配到的科目规则快照，供AI生成JE使用',
  `validation_result` json DEFAULT NULL COMMENT '规则校验结果',

  -- JE generation control
  `je_policy` varchar(64) NOT NULL DEFAULT 'AI_GENERATE' COMMENT 'AI_GENERATE/RULE_GENERATE/NO_JE/MANUAL_REVIEW',
  `je_generation_status` varchar(64) NOT NULL DEFAULT 'NOT_STARTED' COMMENT 'NOT_STARTED/READY_FOR_AI/GENERATING/GENERATED/POSTED/SKIPPED/FAILED',
  `journal_entry_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '生成后的JE ID，未生成则为0',

  -- duplicate prevention
  `event_unique_key` varchar(512) NOT NULL COMMENT '事件唯一key的可读版本',
  `event_key_hash` varchar(255) NOT NULL COMMENT '事件唯一key的hash，用于唯一约束',

  -- status
  `status` varchar(64) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/READY/LOCKED/CANCELLED',

  `version` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '版本号',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '软删除时间',

  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,

  KEY `idx_group_company` (`group_id`, `company_code`),
  KEY `idx_accounting_transaction_id` (`accounting_transaction_id`),
  KEY `idx_company_accounting_date` (`company_code`, `accounting_date`),
  KEY `idx_event_type` (`event_type`),
  KEY `idx_event_sub_type` (`event_sub_type`),
  KEY `idx_period_key` (`period_key`),
  KEY `idx_primary_source` (`primary_source_type`, `primary_source_id`),
  KEY `idx_je_generation_status` (`je_generation_status`),
  KEY `idx_status` (`status`),
  KEY `idx_journal_entry_id` (`journal_entry_id`),
  KEY `idx_event_key_hash` (`event_key_hash`),

  UNIQUE KEY `uk_accounting_event_key`
    (`group_id`, `company_code`, `event_key_hash`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='会计事件表，AI生成JE的唯一输入';
event_unique_key 推荐生成规则
这个非常重要，用来防止重复生成 JE。

1. 费用确认事件
EXPENSE_RECOGNITION:
company_code + accounting_transaction_id + EXPENSE_RECOGNITION
例如：

JP001:TXN5001:EXPENSE_RECOGNITION
含义：一笔业务交易只能确认一次费用。

2. 付款结算事件
PAYMENT_SETTLEMENT:
company_code + accounting_transaction_id + PAYMENT_SETTLEMENT + source_type + source_id
例如：

JP001:TXN5001:PAYMENT_SETTLEMENT:CARD_TRANSACTION:9001
含义：同一笔付款 source 只能结算一次。

3. 分月摊销事件
MONTHLY_ALLOCATION:
company_code + accounting_transaction_id + MONTHLY_ALLOCATION + period_key
例如：

JP001:TXN5001:MONTHLY_ALLOCATION:2026-01
JP001:TXN5001:MONTHLY_ALLOCATION:2026-02
JP001:TXN5001:MONTHLY_ALLOCATION:2026-03
含义：同一业务交易同一月份只能生成一次摊销 JE。

4. 调整事件
ADJUSTMENT:
company_code + accounting_transaction_id + ADJUSTMENT + reason_code + source_hash
例如：

JP001:TXN5001:ADJUSTMENT:TAX_AMOUNT_CHANGED:abc123
三张表如何配合
invoice 进来
invoice_unified_document
        ↓
resolver
        ↓
accounting_transaction
        ↓
accounting_source_link
        ↓
accounting_event
如果 invoice 是主费用凭证：

accounting_transaction.primary_source_type = INVOICE
accounting_source_link.link_role = PRIMARY_EXPENSE_EVIDENCE
accounting_event.event_type = EXPENSE_RECOGNITION
bank/card 进来
如果匹配到已有 invoice：

accounting_source_link.link_role = PAYMENT_EVIDENCE
accounting_event.event_type = PAYMENT_SETTLEMENT
不要再生成：

EXPENSE_RECOGNITION
只有 bank/card，没有 invoice
可以先创建：

accounting_transaction.status = PROVISIONAL
accounting_transaction.evidence_status = INVOICE_MISSING
accounting_transaction.tax_status = PENDING
是否创建 provisional expense event，取决于你的策略：

SaaS/Cloud:
  可以先 wait N days
  closing 前仍无 invoice 再生成 provisional EXPENSE_RECOGNITION
推荐状态流
accounting_transaction.status
OPEN
PROVISIONAL
CONFIRMED
CLOSED
CANCELLED
accounting_transaction.matching_status
INIT
PARTIAL_MATCHED
MATCHED
INVOICE_MISSING
WAITING_PAYMENT
DUPLICATE
accounting_event.status
DRAFT
READY
LOCKED
CANCELLED
accounting_event.je_generation_status
NOT_STARTED
READY_FOR_AI
GENERATING
GENERATED
POSTED
SKIPPED
FAILED
AI agent 只看什么？
AI agent 只看：

accounting_event
accounting_event.source_snapshot
不要让 AI 直接根据 invoice 或 bank transaction 自己判断是否生成 JE。

source_snapshot 示例：

{
  "event_type": "EXPENSE_RECOGNITION",
  "company_code": "JP001",
  "accounting_date": "2026-05-19",
  "currency": "JPY",
  "total_amount": "6531632.0000",
  "amount_excluding_tax": "5937847.0000",
  "tax_amount": "593785.0000",
  "business_category": "ROYALTY",
  "counterparty_name": "株式会社ホビージャパン",
  "primary_source_type": "INVOICE",
  "invoice": {
    "invoice_number": "",
    "document_type": "ROYALTY_STATEMENT",
    "payment_purpose": "2026年1~3月売上分ロイヤリティ",
    "invoice_description": "2026年1~3月売上分のロイヤリティ支払報告...",
    "tax_breakdown": [
      {
        "tax_category": "TAXABLE_10",
        "tax_rate": "0.1000",
        "taxable_amount": "5937847.0000",
        "tax_amount": "593785.0000",
        "tax_inclusive_amount": "6531632.0000"
      }
    ]
  },
  "policy": {
    "tax_treatment": "TAXABLE",
    "input_tax_claimable": true,
    "invoice_requirement_status": "SATISFIED"
  }
}
最重要的系统规则
1. invoice / bank / card / business_voucher 不直接触发 AI JE。

2. 所有 source 先进入 matching / dedupe。

3. matching 后创建或更新 accounting_transaction。

4. source 和 transaction 的关系写入 accounting_source_link。

5. 只有 accounting_event 可以触发 AI JE。

6. 一个 accounting_transaction 通常只能有一个 EXPENSE_RECOGNITION event。

7. PAYMENT_SETTLEMENT 可以多个，因为可能分批付款。

8. MONTHLY_ALLOCATION 可以多个，但同一 period_key 只能一个。

9. event_key_hash 是防重复生成 JE 的核心。

10. AI 只消费 accounting_event.source_snapshot。
最终链路就是：

invoice_unified_document
bank_unified_transaction
business_voucher
        ↓
accounting_transaction
        ↓
accounting_source_link
        ↓
accounting_event
        ↓
AI JE generation





