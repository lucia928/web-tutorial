# **索引优化实战**

示例表

```sql
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(24) NOT NULL DEFAULT '' COMMENT '姓名',
  `age` int(11) NOT NULL DEFAULT '0' COMMENT '年龄',
  `position` varchar(20) NOT NULL DEFAULT '' COMMENT '职位',
  `hire_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入职时间',
  PRIMARY KEY (`id`),
  KEY `idx_name_age_position` (`name`,`age`,`position`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='员工记录表';

INSERT INTO employees(name,age,position,hire_time) VALUES('LiLei',22,'manager',NOW());
INSERT INTO employees(name,age,position,hire_time) VALUES('HanMeimei', 23,'dev',NOW());
INSERT INTO employees(name,age,position,hire_time) VALUES('Lucy',23,'dev',NOW());

-- 插入一些示例数据
drop procedure if exists insert_emp; 
delimiter ;;
create procedure insert_emp()        
begin
  declare i int;                    
  set i=1;                          
  while(i<=100000)do                 
    insert into employees(name,age,position) values(CONCAT('zhuge',i),i,'dev');  
    set i=i+1;                       
  end while;
end;;
delimiter ;
call insert_emp();
```

## **优化案例**

**举一个大家不容易理解的综合例子：**

**1、联合索引第一个字段用范围不会走索引**

```sql
EXPLAIN SELECT * FROM employees WHERE name > 'LiLei' AND age = 22 AND position ='manager';
```

![image-20250120103839762](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201038799.png)

结论：联合索引第一个字段就用范围查找不会走索引，mysql内部可能觉得第一个字段就用范围，结果集应该很大，回表效率不高，还不如就全表扫描

**2、强制走索引**

```sql
EXPLAIN SELECT * FROM employees force index(idx_name_age_position) WHERE name > 'LiLei' AND age = 22 AND position ='manager';
```

![image-20250120103859676](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201038713.png)

结论：虽然使用了强制走索引让联合索引第一个字段范围查找也走索引，扫描的行rows看上去也少了点，但是最终查找效率不一定比全表扫描高，因为回表效率不高

做了一个小实验：

```sql
-- 关闭查询缓存
set global query_cache_size=0;  
set global query_cache_type=0;
-- 执行时间0.333s
SELECT * FROM employees WHERE name > 'LiLei';
-- 执行时间0.444s
SELECT * FROM employees force index(idx_name_age_position) WHERE name > 'LiLei';
```

**3、覆盖索引优化**

```sql
EXPLAIN SELECT name,age,position FROM employees WHERE name > 'LiLei' AND age = 22 AND position ='manager';
```

![image-20250120103926416](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201039449.png)

**4、in和or在表数据量比较大的情况会走索引，在表记录不多的情况下会选择全表扫描**

```sql
EXPLAIN SELECT * FROM employees WHERE name in ('LiLei','HanMeimei','Lucy') AND age = 22 AND position ='manager';
```

![image-20250120104023133](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201040169.png)

```sql
EXPLAIN SELECT * FROM employees WHERE (name = 'LiLei' or name = 'HanMeimei') AND age = 22 AND position ='manager';
```

![image-20250120104040269](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201040305.png)

做一个小实验，将employees 表复制一张employees_copy的表，里面保留两三条记录

```sql
EXPLAIN SELECT * FROM employees_copy WHERE name in ('LiLei','HanMeimei','Lucy') AND age = 22 AND position ='manager';
```

![image-20250120104100730](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201041762.png)

```sql
EXPLAIN SELECT * FROM employees_copy WHERE (name = 'LiLei' or name = 'HanMeimei') AND age = 22 AND position ='manager';
```

![image-20250120104116630](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201041667.png)

**5、like KK% 一般情况都会走索引**

```sql
EXPLAIN SELECT * FROM employees WHERE name like 'LiLei%' AND age = 22 AND position ='manager';
```

 ![image-20250120104150765](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201041812.png)

```sql
EXPLAIN SELECT * FROM employees_copy WHERE name like 'LiLei%' AND age = 22 AND position ='manager';
```

![image-20250120104209430](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201042465.png)

这里给大家补充一个概念，索引下推（Index Condition Pushdown，ICP）, like KK%其实就是用到了索引下推优化。

## **索引下推**

对于辅助的联合索引(name,age,position)，正常情况按照最左前缀原则，`SELECT * FROM employees WHERE name like 'LiLei%' AND age = 22 AND position ='manager'`  这种情况只会走name字段索引，因为根据name字段过滤完，得到的索引行里的age和position是无序的，无法很好的利用索引。

在MySQL5.6之前的版本，这个查询只能在联合索引里匹配到名字是 'LiLei' 开头的索引，然后拿这些索引对应的主键逐个回表，到主键索引上找出相应的记录，再比对age和position这两个字段的值是否符合。

MySQL 5.6引入了索引下推优化，可以在索引遍历过程中，对索引中包含的所有字段先做判断，过滤掉不符合条件的记录之后再回表，可以有效的减少回表次数。使用了索引下推优化后，上面那个查询在联合索引里匹配到名字是 'LiLei' 开头的索引之后，同时还会在索引里过滤age和position这两个字段，拿着过滤完剩下的索引对应的主键id再回表查整行数据。

索引下推会减少回表次数，对于innodb引擎的表索引下推只能用于二级索引，innodb的主键索引（聚簇索引）树叶子节点上保存的是全行数据，所以这个时候索引下推并不会起到减少查询全行数据的效果。

为什么范围查找Mysql没有用索引下推优化？

估计应该是Mysql认为范围查找过滤的结果集过大，like KK% 在绝大多数情况来看，过滤后的结果集比较小，所以这里Mysql选择给 like KK% 用了索引下推优化，当然这也不是绝对的，有时like KK% 也不一定就会走索引下推。

## **Mysql如何选择合适的索引**

```sql
EXPLAIN select * from employees where name > 'a';
```

![image-20250120104308575](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201043613.png)

如果用name索引需要遍历name字段联合索引树，然后还需要根据遍历出来的主键值去主键索引树里再去查出最终数据，成本比全表扫描还高，可以用覆盖索引优化，这样只需要遍历name字段的联合索引树就能拿到所有结果，如下：

```sql
EXPLAIN select name,age,position from employees where name > 'a' ;
```

![image-20250120104331932](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201043967.png)

```sql
EXPLAIN select * from employees where name > 'zzz' ;
```

![image-20250120104405362](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201044395.png)

对于上面这两种 name>'a' 和 name>'zzz' 的执行结果，mysql最终是否选择走索引或者一张表涉及多个索引，mysql最终如何选择索引，我们可以用**trace工具**来一查究竟，开启trace工具会影响mysql性能，所以只能临时分析sql使用，用完之后立即关闭

**trace工具用法：**

```sql
set session optimizer_trace="enabled=on",end_markers_in_json=on;  --开启trace
select * from employees where name > 'a' order by position;
SELECT * FROM information_schema.OPTIMIZER_TRACE;

查看trace字段：
{
  "steps": [
    {
      "join_preparation": {    --第一阶段：SQL准备阶段，格式化sql
        "select#": 1,
        "steps": [
          {
            "expanded_query": "/* select#1 */ select `employees`.`id` AS `id`,`employees`.`name` AS `name`,`employees`.`age` AS `age`,`employees`.`position` AS `position`,`employees`.`hire_time` AS `hire_time` from `employees` where (`employees`.`name` > 'a') order by `employees`.`position`"
          }
        ] /* steps */
      } /* join_preparation */
    },
    {
      "join_optimization": {    --第二阶段：SQL优化阶段
        "select#": 1,
        "steps": [
          {
            "condition_processing": {    --条件处理
              "condition": "WHERE",
              "original_condition": "(`employees`.`name` > 'a')",
              "steps": [
                {
                  "transformation": "equality_propagation",
                  "resulting_condition": "(`employees`.`name` > 'a')"
                },
                {
                  "transformation": "constant_propagation",
                  "resulting_condition": "(`employees`.`name` > 'a')"
                },
                {
                  "transformation": "trivial_condition_removal",
                  "resulting_condition": "(`employees`.`name` > 'a')"
                }
              ] /* steps */
            } /* condition_processing */
          },
          {
            "substitute_generated_columns": {
            } /* substitute_generated_columns */
          },
          {
            "table_dependencies": [    --表依赖详情
              {
                "table": "`employees`",
                "row_may_be_null": false,
                "map_bit": 0,
                "depends_on_map_bits": [
                ] /* depends_on_map_bits */
              }
            ] /* table_dependencies */
          },
          {
            "ref_optimizer_key_uses": [
            ] /* ref_optimizer_key_uses */
          },
          {
            "rows_estimation": [    --预估表的访问成本
              {
                "table": "`employees`",
                "range_analysis": {
                  "table_scan": {     --全表扫描情况
                    "rows": 10123,    --扫描行数
                    "cost": 2054.7    --查询成本
                  } /* table_scan */,
                  "potential_range_indexes": [    --查询可能使用的索引
                    {
                      "index": "PRIMARY",    --主键索引
                      "usable": false,
                      "cause": "not_applicable"
                    },
                    {
                      "index": "idx_name_age_position",    --辅助索引
                      "usable": true,
                      "key_parts": [
                        "name",
                        "age",
                        "position",
                        "id"
                      ] /* key_parts */
                    }
                  ] /* potential_range_indexes */,
                  "setup_range_conditions": [
                  ] /* setup_range_conditions */,
                  "group_index_range": {
                    "chosen": false,
                    "cause": "not_group_by_or_distinct"
                  } /* group_index_range */,
                  "analyzing_range_alternatives": {    --分析各个索引使用成本
                    "range_scan_alternatives": [
                      {
                        "index": "idx_name_age_position",
                        "ranges": [
                          "a < name"      --索引使用范围
                        ] /* ranges */,
                        "index_dives_for_eq_ranges": true,
                        "rowid_ordered": false,    --使用该索引获取的记录是否按照主键排序
                        "using_mrr": false,
                        "index_only": false,       --是否使用覆盖索引
                        "rows": 5061,              --索引扫描行数
                        "cost": 6074.2,            --索引使用成本
                        "chosen": false,           --是否选择该索引
                        "cause": "cost"
                      }
                    ] /* range_scan_alternatives */,
                    "analyzing_roworder_intersect": {
                      "usable": false,
                      "cause": "too_few_roworder_scans"
                    } /* analyzing_roworder_intersect */
                  } /* analyzing_range_alternatives */
                } /* range_analysis */
              }
            ] /* rows_estimation */
          },
          {
            "considered_execution_plans": [
              {
                "plan_prefix": [
                ] /* plan_prefix */,
                "table": "`employees`",
                "best_access_path": {    --最优访问路径
                  "considered_access_paths": [   --最终选择的访问路径
                    {
                      "rows_to_scan": 10123,
                      "access_type": "scan",     --访问类型：为scan，全表扫描
                      "resulting_rows": 10123,
                      "cost": 2052.6,
                      "chosen": true,            --确定选择
                      "use_tmp_table": true
                    }
                  ] /* considered_access_paths */
                } /* best_access_path */,
                "condition_filtering_pct": 100,
                "rows_for_plan": 10123,
                "cost_for_plan": 2052.6,
                "sort_cost": 10123,
                "new_cost_for_plan": 12176,
                "chosen": true
              }
            ] /* considered_execution_plans */
          },
          {
            "attaching_conditions_to_tables": {
              "original_condition": "(`employees`.`name` > 'a')",
              "attached_conditions_computation": [
              ] /* attached_conditions_computation */,
              "attached_conditions_summary": [
                {
                  "table": "`employees`",
                  "attached": "(`employees`.`name` > 'a')"
                }
              ] /* attached_conditions_summary */
            } /* attaching_conditions_to_tables */
          },
          {
            "clause_processing": {
              "clause": "ORDER BY",
              "original_clause": "`employees`.`position`",
              "items": [
                {
                  "item": "`employees`.`position`"
                }
              ] /* items */,
              "resulting_clause_is_simple": true,
              "resulting_clause": "`employees`.`position`"
            } /* clause_processing */
          },
          {
            "reconsidering_access_paths_for_index_ordering": {
              "clause": "ORDER BY",
              "steps": [
              ] /* steps */,
              "index_order_summary": {
                "table": "`employees`",
                "index_provides_order": false,
                "order_direction": "undefined",
                "index": "unknown",
                "plan_changed": false
              } /* index_order_summary */
            } /* reconsidering_access_paths_for_index_ordering */
          },
          {
            "refine_plan": [
              {
                "table": "`employees`"
              }
            ] /* refine_plan */
          }
        ] /* steps */
      } /* join_optimization */
    },
    {
      "join_execution": {    --第三阶段：SQL执行阶段
        "select#": 1,
        "steps": [
        ] /* steps */
      } /* join_execution */
    }
  ] /* steps */
}

结论：全表扫描的成本低于索引扫描，所以mysql最终选择全表扫描

select * from employees where name > 'zzz' order by position;
SELECT * FROM information_schema.OPTIMIZER_TRACE;

查看trace字段可知索引扫描的成本低于全表扫描，所以mysql最终选择索引扫描
set session optimizer_trace="enabled=off";    --关闭trace
```

# **常见sql深入优化**

## **Order by与Group by优化**

Case1：

![image-20250120104507776](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045822.png)

分析：

利用最左前缀法则：中间字段不能断，因此查询用到了name索引，从key_len=74也能看出，age索引列用在排序过程中，因为Extra字段里没有using filesort

Case 2：

![image-20250120104517771](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045824.png)

分析：

从explain的执行结果来看：key_len=74，查询使用了name索引，由于用了position进行排序，跳过了age，出现了Using filesort。

Case 3：

![image-20250120104528980](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045047.png)

分析：

查找只用到索引name，age和position用于排序，无Using filesort。

Case 4：

![image-20250120104536488](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045533.png)

分析：

和Case 3中explain的执行结果一样，但是出现了Using filesort，因为索引的创建顺序为name,age,position，但是排序的时候age和position颠倒位置了。

Case 5：

![image-20250120104544201](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045247.png)

分析：

与Case 4对比，在Extra中并未出现Using filesort，因为age为常量，在排序中被优化，所以索引未颠倒，不会出现Using filesort。

Case 6：

![image-20250120104556674](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201045733.png)

分析：

虽然排序的字段列与索引顺序一样，且order by默认升序，这里position desc变成了降序，导致与索引的排序方式不同，从而产生Using filesort。Mysql8以上版本有降序索引可以支持该种查询方式。

Case 7：

![image-20250120104605020](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201046063.png)

分析：

对于排序来说，多个相等条件也是范围查询

Case 8：

![image-20250120104611560](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201046610.png)

可以用覆盖索引优化

![image-20250120104618163](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201046214.png)

## **Order by与Group by优化总结**

1、MySQL支持两种方式的排序filesort和index，Using index是指MySQL扫描索引本身完成排序。index效率高，filesort效率低。

2、order by满足两种情况会使用Using index。

-  order by语句使用索引最左前列。
- 使用where子句与order by子句条件列组合满足索引最左前列。

3、尽量在索引列上完成排序，遵循索引建立（索引创建的顺序）时的最左前缀法则。

4、如果order by的条件不在索引列上，就会产生Using filesort。

5、能用覆盖索引尽量用覆盖索引

6、group by与order by很类似，其实质是先排序后分组，遵照索引创建顺序的最左前缀法则。对于group by的优化如果不需要排序的可以加上**order by null禁止排序**。注意，where高于having，能写在where中的限定条件就不要去having限定了。

## **Using filesort文件排序原理详解**

**filesort文件排序方式**

- 单路排序：是一次性取出满足条件行的所有字段，然后在sort buffer中进行排序；用trace工具可以看到sort_mode信息里显示< sort_key, additional_fields >或者< sort_key, packed_additional_fields >
- 双路排序（又叫**回表**排序模式）：是首先根据相应的条件取出相应的**排序字段**和**可以直接定位行数据的行 ID**，然后在 sort buffer 中进行排序，排序完后需要再次取回其它需要的字段；用trace工具可以看到sort_mode信息里显示< sort_key, rowid >

MySQL 通过比较系统变量 max_length_for_sort_data(**默认1024字节**) 的大小和需要查询的字段总大小来判断使用哪种排序模式。

- 如果 字段的总长度小于max_length_for_sort_data ，那么使用 单路排序模式；
- 如果 字段的总长度大于max_length_for_sort_data ，那么使用 双路排序模式。

**示例验证下各种排序方式：**

![image-20250120104656758](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201046800.png)

查看下这条sql对应trace结果如下(只展示排序部分)：

```sql
set session optimizer_trace="enabled=on",end_markers_in_json=on;  --开启trace
select * from employees where name = 'zhuge' order by position;
select * from information_schema.OPTIMIZER_TRACE;

trace排序部分结果：
"join_execution": {    --Sql执行阶段
        "select#": 1,
        "steps": [
          {
            "filesort_information": [
              {
                "direction": "asc",
                "table": "`employees`",
                "field": "position"
              }
            ] /* filesort_information */,
            "filesort_priority_queue_optimization": {
              "usable": false,
              "cause": "not applicable (no LIMIT)"
            } /* filesort_priority_queue_optimization */,
            "filesort_execution": [
            ] /* filesort_execution */,
            "filesort_summary": {                      --文件排序信息
              "rows": 10000,                           --预计扫描行数
              "examined_rows": 10000,                  --参与排序的行
              "number_of_tmp_files": 3,                --使用临时文件的个数，这个值如果为0代表全部使用的sort_buffer内存排序，否则使用的磁盘文件排序
              "sort_buffer_size": 262056,              --排序缓存的大小，单位Byte
              "sort_mode": "<sort_key, packed_additional_fields>"       --排序方式，这里用的单路排序
            } /* filesort_summary */
          }
        ] /* steps */
      } /* join_execution */
      
      
mysql> set max_length_for_sort_data = 10;    --employees表所有字段长度总和肯定大于10字节
mysql> select * from employees where name = 'zhuge' order by position;
mysql> select * from information_schema.OPTIMIZER_TRACE;

trace排序部分结果：
"join_execution": {
        "select#": 1,
        "steps": [
          {
            "filesort_information": [
              {
                "direction": "asc",
                "table": "`employees`",
                "field": "position"
              }
            ] /* filesort_information */,
            "filesort_priority_queue_optimization": {
              "usable": false,
              "cause": "not applicable (no LIMIT)"
            } /* filesort_priority_queue_optimization */,
            "filesort_execution": [
            ] /* filesort_execution */,
            "filesort_summary": {
              "rows": 10000,
              "examined_rows": 10000,
              "number_of_tmp_files": 2,
              "sort_buffer_size": 262136,   
              "sort_mode": "<sort_key, rowid>"         --排序方式，这里用的双路排序
            } /* filesort_summary */
          }
        ] /* steps */
      } /* join_execution */

set session optimizer_trace="enabled=off";    --关闭trace
```

我们先看单路排序的详细过程：

1. 从索引name找到第一个满足 name = ‘zhuge’ 条件的主键 id
2. 根据主键 id 取出整行，取出所有字段的值，存入 sort_buffer 中
3. 从索引name找到下一个满足 name = ‘zhuge’ 条件的主键 id
4. 重复步骤 2、3 直到不满足 name = ‘zhuge’ 
5. 对 sort_buffer 中的数据按照字段 position 进行排序
6. 返回结果给客户端

我们再看下双路排序的详细过程：

1. 从索引 name 找到第一个满足 name = ‘zhuge’  的主键id
2. 根据主键 id 取出整行，把排序字段 position 和主键 id 这两个字段放到 sort buffer 中
3. 从索引 name 取下一个满足 name = ‘zhuge’  记录的主键 id
4. 重复 3、4 直到不满足 name = ‘zhuge’ 
5. 对 sort_buffer 中的字段 position 和主键 id 按照字段 position 进行排序
6. 遍历排序好的 id 和字段 position，按照 id 的值回到原表中取出 所有字段的值返回给客户端

其实对比两个排序模式，单路排序会把所有需要查询的字段都放到 sort buffer 中，而双路排序只会把主键和需要排序的字段放到 sort buffer 中进行排序，然后再通过主键回到原表查询需要的字段。

如果 MySQL 排序内存 sort_buffer 配置的比较小并且没有条件继续增加了，可以适当把 max_length_for_sort_data 配置小点，让优化器选择使用双路排序算法，可以在sort_buffer 中一次排序更多的行，只是需要再根据主键回到原表取数据。

如果 MySQL 排序内存有条件可以配置比较大，可以适当增大 max_length_for_sort_data 的值，让优化器优先选择全字段排序(单路排序)，把需要的字段放到 sort_buffer 中，这样排序后就会直接从内存里返回查询结果了。

所以，MySQL通过 max_length_for_sort_data 这个参数来控制排序，在不同场景使用不同的排序模式，从而提升排序效率。

注意，如果全部使用sort_buffer内存排序一般情况下效率会高于磁盘文件排序，但不能因为这个就随便增大sort_buffer(默认1M)，mysql很多参数设置都是做过优化的，不要轻易调整。

**索引设计原则**

**1、代码先行，索引后上**

不知大家一般是怎么给数据表建立索引的，是建完表马上就建立索引吗？

这其实是不对的，一般应该等到主体业务功能开发完毕，把涉及到该表相关sql都要拿出来分析之后再建立索引。

**2、联合索引尽量覆盖条件**

比如可以设计一个或者两三个联合索引(尽量少建单值索引)，让每一个联合索引都尽量去包含sql语句里的where、order by、group by的字段，还要确保这些联合索引的字段顺序尽量满足sql查询的最左前缀原则。

**3、不要在小基数字段上建立索引**

索引基数是指这个字段在表里总共有多少个不同的值，比如一张表总共100万行记录，其中有个性别字段，其值不是男就是女，那么该字段的基数就是2。

如果对这种小基数字段建立索引的话，还不如全表扫描了，因为你的索引树里就包含男和女两种值，根本没法进行快速的二分查找，那用索引就没有太大的意义了。

一般建立索引，尽量使用那些基数比较大的字段，就是值比较多的字段，那么才能发挥出B+树快速二分查找的优势来。

**4、长字符串我们可以采用前缀索引**

尽量对字段类型较小的列设计索引，比如说什么tinyint之类的，因为字段类型较小的话，占用磁盘空间也会比较小，此时你在搜索的时候性能也会比较好一点。

当然，这个所谓的字段类型小一点的列，也不是绝对的，很多时候你就是要针对varchar(255)这种字段建立索引，哪怕多占用一些磁盘空间也是有必要的。

对于这种varchar(255)的大字段可能会比较占用磁盘空间，可以稍微优化下，比如针对这个字段的前20个字符建立索引，就是说，对这个字段里的每个值的前20个字符放在索引树里，类似于 KEY index(name(20),age,position)。

此时你在where条件里搜索的时候，如果是根据name字段来搜索，那么此时就会先到索引树里根据name字段的前20个字符去搜索，定位到之后前20个字符的前缀匹配的部分数据之后，再回到聚簇索引提取出来完整的name字段值进行比对。

但是假如你要是order by name，那么此时你的name因为在索引树里仅仅包含了前20个字符，所以这个排序是没法用上索引的， group by也是同理。所以这里大家要对前缀索引有一个了解。

**5、where与order by冲突时优先where**

在where和order by出现索引设计冲突时，到底是针对where去设计索引，还是针对order by设计索引？到底是让where去用上索引，还是让order by用上索引?

一般这种时候往往都是让where条件去使用索引来快速筛选出来一部分指定的数据，接着再进行排序。

因为大多数情况基于索引进行where筛选往往可以最快速度筛选出你要的少部分数据，然后做排序的成本可能会小很多。

**6、基于慢sql查询做优化**

可以根据监控后台的一些慢sql，针对这些慢sql查询做特定的索引优化。

# **索引设计实战**

以社交场景APP来举例，我们一般会去搜索一些好友，这里面就涉及到对用户信息的筛选，这里肯定就是对用户user表搜索了，这个表一般来说数据量会比较大，我们先不考虑分库分表的情况，比如，我们一般会筛选地区(省市)，性别，年龄，身高，爱好之类的，有的APP可能用户还有评分，比如用户的受欢迎程度评分，我们可能还会根据评分来排序等等。

对于后台程序来说除了过滤用户的各种条件，还需要分页之类的处理，可能会生成类似sql语句执行：

```sql
select xx from user where xx=xx and xx=xx order by xx limit xx,xx
```

对于这种情况如何合理设计索引了，比如用户可能经常会根据省市优先筛选同城的用户，还有根据性别去筛选，那我们是否应该设计一个联合索引 (province,city,sex) 了？这些字段好像基数都不大，其实是应该的，因为这些字段查询太频繁了。

假设又有用户根据年龄范围去筛选了，比如 `where  province=xx and city=xx and age>=xx and age<=xx`，我们尝试着把age字段加入联合索引 (province,city,sex,age)，注意，一般这种范围查找的条件都要放在最后，之前讲过联合索引范围之后条件的是不能用索引的，但是对于当前这种情况依然用不到age这个索引字段，因为用户没有筛选sex字段，那怎么优化了？其实我们可以这么来优化下sql的写法：`where  province=xx and city=xx and sex in ('female','male') and age>=xx and age<=xx`。

对于爱好之类的字段也可以类似sex字段处理，所以可以把爱好字段也加入索引 (province,city,sex,hobby,age) 

假设可能还有一个筛选条件，比如要筛选最近一周登录过的用户，一般大家肯定希望跟活跃用户交友了，这样能尽快收到反馈，对应后台sql可能是这样：

```sql
where  province=xx and city=xx and sex in ('female','male') and age>=xx and age<=xx and latest_login_time>= xx
```

那我们是否能把 latest_login_time 字段也加入索引了？比如  (province,city,sex,hobby,age,latest_login_time) ，显然是不行的，那怎么来优化这种情况了？其实我们可以试着再设计一个字段is_login_in_latest_7_days，用户如果一周内有登录值就为1，否则为0，那么我们就可以把索引设计成 (province,city,sex,hobby,is_login_in_latest_7_days,age)  来满足上面那种场景了！

一般来说，通过这么一个多字段的索引是能够过滤掉绝大部分数据的，就保留小部分数据下来基于磁盘文件进行order by语句的排序，最后基于limit进行分页，那么一般性能还是比较高的。

不过有时可能用户会这么来查询，就查下受欢迎度较高的女性，比如`sql：where  sex = 'female'  order by score limit xx,xx`，那么上面那个索引是很难用上的，不能把太多的字段以及太多的值都用 in 语句拼接到sql里的，那怎么办了？其实我们可以再设计一个辅助的联合索引，比如 (sex,score)，这样就能满足查询要求了。

以上就是给大家讲的一些索引设计的思路了，核心思想就是，尽量利用一两个复杂的多字段联合索引，抗下你80%以上的查询，然后用一两个辅助索引尽量抗下剩余的一些非典型查询，保证这种大数据量表的查询尽可能多的都能充分利用索引，这样就能保证你的查询速度和性能了！

![image-20250120104858509](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201048589.png)

# **分页查询优化**

```sql
示例表：
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(24) NOT NULL DEFAULT '' COMMENT '姓名',
  `age` int(11) NOT NULL DEFAULT '0' COMMENT '年龄',
  `position` varchar(20) NOT NULL DEFAULT '' COMMENT '职位',
  `hire_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入职时间',
  PRIMARY KEY (`id`),
  KEY `idx_name_age_position` (`name`,`age`,`position`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='员工记录表';
```

很多时候我们业务系统实现分页功能可能会用如下sql实现

```sql
select * from employees limit 10000,10;
```

表示从表 employees 中取出从 10001 行开始的 10 行记录。看似只查询了 10 条记录，实际这条 SQL 是先读取 10010 条记录，然后抛弃前 10000 条记录，然后读到后面 10 条想要的数据。因此要查询一张大表比较靠后的数据，执行效率是非常低的。

## **自增且连续主键排序且连续的主键排序的分页查询**

首先来看一个根据自增且连续主键排序的分页查询的例子：

```sql
select * from employees limit 90000,5;
```

![image-20250120105407943](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201054994.png)

该 SQL 表示查询从第 90001开始的五行数据，没添加单独 order by，表示通过**主键排序**。我们再看表 employees ，因为主键是自增并且连续的，所以可以改写成按照主键去查询从第 90001开始的五行数据，如下：

```sql
select * from employees where id > 90000 limit 5;
```

![image-20250120105426479](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201054533.png)

查询的结果是一致的。我们再对比一下执行计划：

```sql
EXPLAIN select * from employees limit 90000,5;
```

![image-20250120105545054](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201055102.png)

```sql
EXPLAIN select * from employees where id > 90000 limit 5;
```

![image-20250120105605564](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201056608.png)

显然改写后的 SQL 走了索引，而且扫描的行数大大减少，执行效率更高。 

但是，这条改写的SQL 在很多场景并不实用，因为表中可能某些记录被删后，主键空缺，导致结果不一致，如下图试验所示（先删除一条前面的记录，然后再测试原 SQL 和优化后的 SQL）：

![image-20250120105616219](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201056271.png)

![image-20250120105630164](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201056212.png)

两条 SQL 的结果并不一样，因此，如果主键不连续，不能使用上面描述的优化方法。

另外如果原 SQL 是 order by 非主键的字段，按照上面说的方法改写会导致两条 SQL 的结果不一致。所以这种改写得满足以下两个条件：

- 主键自增且连续
- 结果是按照主键排序的

## **根据非主键字段排序的分页查询**

再看一个根据非主键字段排序的分页查询，SQL 如下：

```sql
select * from employees ORDER BY name limit 90000,5;
```

![image-20250120110413138](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201104186.png)

```sql
EXPLAIN select * from employees ORDER BY name limit 90000,5;
```

![image-20250120110522069](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201105119.png)

发现并没有使用 name 字段的索引（key 字段对应的值为 null），具体原因上节课讲过：**扫描整个索引并查找到没索引的行(可能要遍历多个索引树)的成本比扫描全表的成本更高，所以优化器放弃使用索引**。

知道不走索引的原因，那么怎么优化呢？

其实关键是**让排序时返回的字段尽可能少**，所以可以让排序和分页操作先查出主键，然后根据主键查到对应的记录，SQL改写如下：

```sql
select * from employees e inner join (select id from employees order by name limit 90000,5) ed on e.id = ed.id;
```

原 SQL 使用的是 filesort 排序，而优化后的 SQL 使用的是索引排序。

# **Join关联查询优化**

```sql
-- 示例表：
CREATE TABLE `t1` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `a` int(11) DEFAULT NULL,
  `b` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_a` (`a`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table t2 like t1;

-- 插入一些示例数据
-- 往t1表插入1万行记录
drop procedure if exists insert_t1; 
delimiter ;;
create procedure insert_t1()        
begin
  declare i int;                    
  set i=1;                          
  while(i<=10000)do                 
    insert into t1(a,b) values(i,i);  
    set i=i+1;                       
  end while;
end;;
delimiter ;
call insert_t1();

-- 往t2表插入100行记录
drop procedure if exists insert_t2; 
delimiter ;;
create procedure insert_t2()        
begin
  declare i int;                    
  set i=1;                          
  while(i<=100)do                 
    insert into t2(a,b) values(i,i);  
    set i=i+1;                       
  end while;
end;;
delimiter ;
call insert_t2();
```

## **mysql的表关联常见有两种算法**

- Nested-Loop Join 算法

- Block Nested-Loop Join 算法

1、 嵌套循环连接 Nested-Loop Join**(NLJ) 算法**

一次一行循环地从第一张表（称为**驱动表**）中读取行，在这行数据中取到关联字段，根据关联字段在另一张表（**被驱动表**）里取出满足条件的行，然后取出两张表的结果合集。

```sql
EXPLAIN select * from t1 inner join t2 on t1.a= t2.a;
```

![image-20250120110653188](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201106248.png)

从执行计划中可以看到这些信息：

- 驱动表是 t2，被驱动表是 t1。先执行的就是驱动表(执行计划结果的id如果一样则按从上到下顺序执行sql)；优化器一般会优先选择小表做驱动表，用where条件过滤完驱动表，然后再跟被驱动表做关联查询。所以使用 inner join 时，排在前面的表并不一定就是驱动表。
- 当使用left join时，左表是驱动表，右表是被驱动表，当使用right join时，右表时驱动表，左表是被驱动表，当使用join时，mysql会选择数据量比较小的表作为驱动表，大表作为被驱动表。
- 使用了 NLJ算法。一般 join 语句中，如果执行计划 Extra 中未出现 Using join buffer 则表示使用的 join 算法是 NLJ。

上面sql的大致流程如下：

1. 从表 t2 中读取一行数据（如果t2表有查询过滤条件的，用先用条件过滤完，再从过滤结果里取出一行数据）；
2. 从第 1 步的数据中，取出关联字段 a，到表 t1 中查找；
3. 取出表 t1 中满足条件的行，跟 t2 中获取到的结果合并，作为结果返回给客户端；
4. 重复上面 3 步。

整个过程会读取 t2 表的所有数据(扫描100行)，然后遍历这每行数据中字段 a 的值，根据 t2 表中 a 的值索引扫描 t1 表中的对应行(扫描100次 t1 表的索引，1次扫描可以认为最终只扫描 t1 表一行完整数据，也就是总共 t1 表也扫描了100行)。因此整个过程扫描了 200 行。

如果被驱动表的关联字段没索引，**使用NLJ算法性能会比较低(下面有详细解释)**，mysql会选择Block Nested-Loop Join算法。

**2、** **基于块的嵌套循环连接** **Block Nested-Loop Join(BNL)算法**

把**驱动表**的数据读入到 join_buffer 中，然后扫描**被驱动表**，把**被驱动表**每一行取出来跟 join_buffer 中的数据做对比。

```sql
EXPLAIN select * from t1 inner join t2 on t1.b= t2.b;
```

![image-20250120110722263](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201107315.png)

Extra 中 的Using join buffer (Block Nested Loop)说明该关联查询使用的是 BNL 算法。

**上面sql的大致流程如下：**

1. 把 t2 的所有数据放入到 join_buffer 中
2. 把表 t1 中每一行取出来，跟 join_buffer 中的数据做对比
3. 返回满足 join 条件的数据

整个过程对表 t1 和 t2 都做了一次全表扫描，因此扫描的总行数为10000(表 t1 的数据总量) + 100(表 t2 的数据总量) = **10100**。并且 join_buffer 里的数据是无序的，因此对表 t1 中的每一行，都要做 100 次判断，所以内存中的判断次数是 100 * 10000= **100 万次**。

这个例子里表 t2 才 100 行，要是表 t2 是一个大表，join_buffer 放不下怎么办呢？·

join_buffer 的大小是由参数 join_buffer_size 设定的，默认值是 256k。如果放不下表 t2 的所有数据话，策略很简单，就是分段放。

比如 t2 表有1000行记录， join_buffer 一次只能放800行数据，那么执行过程就是先往 join_buffer 里放800行记录，然后从 t1 表里取数据跟 join_buffer 中数据对比得到部分结果，然后清空  join_buffer ，再放入 t2 表剩余200行记录，再次从 t1 表里取数据跟 join_buffer 中数据对比。所以就多扫了一次 t1 表。

**被驱动表的关联字段没索引为什么要选择使用 BNL 算法而不使用 Nested-Loop Join 呢？**

如果上面第二条sql使用 Nested-Loop Join，那么扫描行数为 100 * 10000 = 100万次，这个是**磁盘扫描**。

很显然，用BNL磁盘扫描次数少很多，相比于磁盘扫描，BNL的内存计算会快得多。

因此MySQL对于被驱动表的关联字段没索引的关联查询，一般都会使用 BNL 算法。如果有索引一般选择 NLJ 算法，有索引的情况下 NLJ 算法比 BNL算法性能更高

## **对于关联sql的优化**

- **关联字段加索引**，让mysql做join操作时尽量选择NLJ算法，驱动表因为需要全部查询出来，所以过滤的条件也尽量要走索引，避免全表扫描，总之，能走索引的过滤条件尽量都走索引
- **小表驱动大表**，写多表连接sql时如果**明确知道**哪张表是小表可以用straight_join写法固定连接驱动方式，省去mysql优化器自己判断的时间

straight_join解释：straight_join功能同join类似，但能让左边的表来驱动右边的表，能改表优化器对于联表查询的执行顺序。

比如：`select * from t2 straight_join t1 on t2.a = t1.a;` 代表指定mysql选着 t2 表作为驱动表。

- straight_join只适用于inner join，并不适用于left join，right join。（因为left join，right join已经代表指定了表的执行顺序）
- 尽可能让优化器去判断，因为大部分情况下mysql优化器是比人要聪明的。使用straight_join一定要慎重，因为部分情况下人为指定的执行顺序并不一定会比优化引擎要靠谱。

对于小表定义的明确

在决定哪个表做驱动表的时候，应该是两个表按照各自的条件过滤，过滤完成之后，计算参与 join 的各个字段的总数据量，数据量小的那个表，就是“小表”，应该作为驱动表。

# **in和exsits优化**

原则：小表驱动大表，即小的数据集驱动大的数据集

in：当B表的数据集小于A表的数据集时，in优于exists 

```sql
select * from A where id in (select id from B)  
#等价于：
for (select id from B) {
      select * from A where A.id = B.id
 }
```

exists：当A表的数据集小于B表的数据集时，exists优于in

将主查询A的数据，放到子查询B中做条件验证，根据验证结果（true或false）来决定主查询的数据是否保留

```sql
select * from A where exists (select 1 from B where B.id = A.id)
#等价于:
for	(select * from A) {
   select * from B where B.id = A.id
}
#A表与B表的ID字段应建立索引
```

1. EXISTS (subquery)只返回TRUE或FALSE,因此子查询中的SELECT * 也可以用SELECT 1替换,官方说法是实际执行时会忽略SELECT清单,因此没有区别
2. EXISTS子查询的实际执行过程可能经过了优化而不是我们理解上的逐条对比
3. EXISTS子查询往往也可以用JOIN来代替，何种最优需要具体问题具体分析

# **count(\*)查询优化**

```sql
-- 临时关闭mysql查询缓存，为了查看sql多次执行的真实时间
set global query_cache_size=0;
set global query_cache_type=0;

EXPLAIN select count(1) from employees;
EXPLAIN select count(id) from employees;
EXPLAIN select count(name) from employees;
EXPLAIN select count(*) from employees;
```

注意：以上4条sql只有根据某个字段count不会统计字段为null值的数据行

![image-20250120111007233](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201110287.png)

四个sql的执行计划一样，说明这四个sql执行效率应该差不多

字段有索引：`count(*)≈count(1)>count(字段)>count(主键 id)`，字段有索引，count(字段)统计走二级索引，二级索引存储数据比主键索引少，所以count(字段)>count(主键 id) 

字段无索引：`count(*)≈count(1)>count(主键 id)>count(字段)` ，字段没有索引count(字段)统计走不了索引，count(主键 id)还可以走主键索引，所以count(主键 id)>count(字段)

count(1)跟count(字段)执行过程类似，不过count(1)不需要取出字段统计，就用常量1做统计，count(字段)还需要取出字段，所以理论上count(1)比count(字段)会快一点。

`count(*)` 是例外，mysql并不会把全部字段取出来，而是专门做了优化，不取值，按行累加，效率很高，所以不需要用count(列名)或count(常量)来替代 `count(*)`。

为什么对于count(id)，mysql最终选择辅助索引而不是主键聚集索引？因为二级索引相对主键索引存储数据更少，检索性能应该更高，mysql内部做了点优化(应该是在5.7版本才优化)。

## **常见优化方法**

1、查询mysql自己维护的总行数

对于myisam存储引擎的表做不带where条件的count查询性能是很高的，因为myisam存储引擎的表的总行数会被mysql存储在磁盘上，查询不需要计算

![image-20250120111146490](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201111550.png)

对于innodb存储引擎的表mysql不会存储表的总记录行数(因为有MVCC机制，后面会讲)，查询count需要实时计算

2、show table status

如果只需要知道表总行数的估计值可以用如下sql查询，性能很高

![image-20250120111159893](https://blog-1304855543.cos.ap-guangzhou.myqcloud.com/blog/202501201111940.png)

3、将总数维护到Redis里

插入或删除表数据行的时候同时维护redis里的表总行数key的计数值(用incr或decr命令)，但是这种方式可能不准，很难保证表操作和redis操作的事务一致性

4、增加数据库计数表

插入或删除表数据行的时候同时维护计数表，让他们在同一个事务里操作

# **MySQL数据类型选择**

在MySQL中，选择正确的数据类型，对于性能至关重要。一般应该遵循下面两步：

1. 确定合适的大类型：数字、字符串、时间、二进制；
2. 确定具体的类型：有无符号、取值范围、变长定长等。

在MySQL数据类型设置方面，尽量用更小的数据类型，因为它们通常有更好的性能，花费更少的硬件资源。并且，尽量把字段定义为NOT NULL，避免使用NULL。

## **数值类型**

| 类型         | 大小                                     | 范围（有符号）                                               | 范围（无符号）                                               | 用途           |
| ------------ | ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------- |
| TINYINT      | 1 字节                                   | (-128, 127)                                                  | (0, 255)                                                     | 小整数值       |
| SMALLINT     | 2 字节                                   | (-32 768, 32 767)                                            | (0, 65 535)                                                  | 大整数值       |
| MEDIUMINT    | 3 字节                                   | (-8 388 608, 8 388 607)                                      | (0, 16 777 215)                                              | 大整数值       |
| INT或INTEGER | 4 字节                                   | (-2 147 483 648, 2 147 483 647)                              | (0, 4 294 967 295)                                           | 大整数值       |
| BIGINT       | 8 字节                                   | (-9 233 372 036 854 775 808, 9 223 372 036 854 775 807)      | (0, 18 446 744 073 709 551 615)                              | 极大整数值     |
| FLOAT        | 4 字节                                   | (-3.402 823 466 E+38, 1.175 494 351 E-38)，0，(1.175 494 351 E-38，3.402 823 466 351 E+38) | 0, (1.175 494 351 E-38, 3.402 823 466 E+38)                  | 单精度浮点数值 |
| DOUBLE       | 8 字节                                   | (1.797 693 134 862 315 7 E+308, 2.225 073 858 507 201 4 E-308), 0, (2.225 073 858 507 201 4 E-308, 1.797 693 134 862 315 7 E+308) | 0, (2.225 073 858 507 201 4 E-308, 1.797 693 134 862 315 7 E+308) | 双精度浮点数值 |
| DECIMAL      | 对DECIMAL(M,D) ，如果M>D，为M+2否则为D+2 | 依赖于M和D的值                                               | 依赖于M和D的值                                               | 小数值         |

### **优化建议**

1. 如果整形数据没有负数，如ID号，建议指定为UNSIGNED无符号类型，容量可以扩大一倍。
2. 建议使用TINYINT代替ENUM、BITENUM、SET。
3. 避免使用整数的显示宽度(参看文档最后)，也就是说，不要用INT(10)类似的方法指定字段显示宽度，直接用INT。
4. DECIMAL最适合保存准确度要求高，而且用于计算的数据，比如价格。但是在使用DECIMAL类型的时候，注意长度设置。
5. 建议使用整形类型来运算和存储实数，方法是，实数乘以相应的倍数后再操作。
6. 整数通常是最佳的数据类型，因为它速度快，并且能使用AUTO_INCREMENT。

## **日期和时间**

| 类型      | 大小(字节) | 范围                                       | 格式                | 用途                     |
| --------- | ---------- | ------------------------------------------ | ------------------- | ------------------------ |
| DATE      | 3          | 1000-01-01 到 9999-12-31                   | YYYY-MM-DD          | 日期值                   |
| TIME      | 3          | '-838:59:59' 到 '838:59:59'                | HH:MM:SS            | 时间值或持续时间         |
| YEAR      | 1          | 1901 到 2155                               | YYYY                | 年份值                   |
| DATETIME  | 8          | 1000-01-01 00:00:00 到 9999-12-31 23:59:59 | YYYY-MM-DD HH:MM:SS | 混合日期和时间值         |
| TIMESTAMP | 4          | 1970-01-01 00:00:00 到 2038-01-19 03:14:07 | YYYYMMDDhhmmss      | 混合日期和时间值，时间戳 |

### **优化建议**

1. MySQL能存储的最小时间粒度为秒。
2. 建议用DATE数据类型来保存日期。MySQL中默认的日期格式是yyyy-mm-dd。
3. 用MySQL的内建类型DATE、TIME、DATETIME来存储时间，而不是使用字符串。
4. 当数据格式为TIMESTAMP和DATETIME时，可以用CURRENT_TIMESTAMP作为默认（MySQL5.6以后），MySQL会自动返回记录插入的确切时间。
5. TIMESTAMP是UTC时间戳，与时区相关。
6. DATETIME的存储格式是一个YYYYMMDD HH:MM:SS的整数，与时区无关，你存了什么，读出来就是什么。
7. 除非有特殊需求，一般的公司建议使用TIMESTAMP，它比DATETIME更节约空间，但是像阿里这样的公司一般会用DATETIME，因为不用考虑TIMESTAMP将来的时间上限问题。
8. 有时人们把Unix的时间戳保存为整数值，但是这通常没有任何好处，这种格式处理起来不太方便，我们并不推荐它。

## **字符串**

| 类型       | 大小                | 用途                                                         |
| ---------- | ------------------- | ------------------------------------------------------------ |
| CHAR       | 0-255字节           | 定长字符串，char(n)当插入的字符数不足n时(n代表字符数)，插入空格进行补充保存。在进行检索时，尾部的空格会被去掉。 |
| VARCHAR    | 0-65535 字节        | 变长字符串，varchar(n)中的n代表最大字符数，插入的字符数不足n时不会补充空格 |
| TINYBLOB   | 0-255字节           | 不超过 255 个字符的二进制字符串                              |
| TINYTEXT   | 0-255字节           | 短文本字符串                                                 |
| BLOB       | 0-65 535字节        | 二进制形式的长文本数据                                       |
| TEXT       | 0-65 535字节        | 长文本数据                                                   |
| MEDIUMBLOB | 0-16 777 215字节    | 二进制形式的中等长度文本数据                                 |
| MEDIUMTEXT | 0-16 777 215字节    | 中等长度文本数据                                             |
| LONGBLOB   | 0-4 294 967 295字节 | 二进制形式的极大文本数据                                     |
| LONGTEXT   | 0-4 294 967 295字节 | 极大文本数据                                                 |

### **优化建议**

1. 字符串的长度相差较大用VARCHAR；字符串短，且所有值都接近一个长度用CHAR。
2. CHAR和VARCHAR适用于包括人名、邮政编码、电话号码和不超过255个字符长度的任意字母数字组合。那些要用来计算的数字不要用VARCHAR类型保存，因为可能会导致一些与计算相关的问题。换句话说，可能影响到计算的准确性和完整性。
3. 尽量少用BLOB和TEXT，如果实在要用可以考虑将BLOB和TEXT字段单独存一张表，用id关联。
4. BLOB系列存储二进制字符串，与字符集无关。TEXT系列存储非二进制字符串，与字符集相关。
5. BLOB和TEXT都不能有默认值。

## **PS：INT显示宽度**

我们经常会使用命令来创建数据表，而且同时会指定一个长度，如下。但是，这里的长度并非是TINYINT类型存储的最大长度，而是显示的最大长度。

```sql
CREATE TABLE `user`(
    `id` TINYINT(2) UNSIGNED
);
```

这里表示user表的id字段的类型是TINYINT，可以存储的最大数值是255。所以，在存储数据时，如果存入值小于等于255，如200，虽然超过2位，但是没有超出TINYINT类型长度，所以可以正常保存；如果存入值大于255，如500，那么MySQL会自动保存为TINYINT类型的最大值255。

在查询数据时，不管查询结果为何值，都按实际输出。这里TINYINT(2)中2的作用就是，当需要在查询结果前填充0时，命令中加上ZEROFILL就可以实现，如：

```sql
`id` TINYINT(2) UNSIGNED ZEROFILL
```

这样，查询结果如果是5，那输出就是05。如果指定TINYINT(5)，那输出就是00005，其实实际存储的值还是5，而且存储的数据不会超过255，只是MySQL输出数据时在前面填充了0。

换句话说，在MySQL命令中，字段的类型长度TINYINT(2)、INT(11)不会影响数据的插入，只会在使用ZEROFILL时有用，让查询结果前填充0。